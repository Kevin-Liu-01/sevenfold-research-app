import logging
import sys
from typing import Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from compiler_orchestrator import compile_project_asset
from config import settings
from db.files_service import FilesService
from db.supabase import supabase
from middleware import auth_middleware, rate_limit_middleware, request_id_middleware
from utils.auth import get_user_id, verify_file_access, verify_project_access
from latex_compiler import check_tectonic_available


# Configure structured logging with custom formatter
class RequestIDFormatter(logging.Formatter):
    """Custom formatter that handles request_id in log records."""
    def format(self, record):
        # Get request_id from extra dict if available
        request_id = getattr(record, 'request_id', None)
        if not request_id and hasattr(record, 'extra') and isinstance(record.extra, dict):
            request_id = record.extra.get('request_id')
        
        if request_id:
            record.request_id = request_id
        else:
            record.request_id = 'N/A'
        
        return super().format(record)

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Apply custom formatter
for handler in logging.root.handlers:
    handler.setFormatter(RequestIDFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
    ))

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="Microservice for compiling LaTeX documents to PDF using Tectonic",
    version=settings.app_version
)

# Add middleware
app.middleware("http")(request_id_middleware)
app.middleware("http")(auth_middleware)
app.middleware("http")(rate_limit_middleware)

# Add CORS middleware (configure as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompileRequest(BaseModel):
    """Request model for project/asset-based compilation."""

    timeout: Optional[int] = Field(
        default=settings.default_timeout,
        ge=settings.min_timeout,
        le=settings.max_timeout,
        description=f"Compilation timeout in seconds (min: {settings.min_timeout}, max: {settings.max_timeout})",
    )


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    tectonic_available: bool
    version: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "tectonic_available": True,
                "version": "1.0.0"
            }
        }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify service is running and Tectonic is available."""
    tectonic_available = check_tectonic_available()
    return HealthResponse(
        status="healthy" if tectonic_available else "degraded",
        tectonic_available=tectonic_available,
        version=settings.app_version
    )


@app.post("/compile/{project_id}/{asset_id}")
async def compile_latex_project_asset(
    project_id: UUID,
    asset_id: UUID,
    request: CompileRequest,
    http_request: Request,
    authorization: str = Header(...),
):
    """
    Compile a project asset by resolving its dependencies and invoking Tectonic.
    """
    request_id = getattr(http_request.state, "request_id", "unknown")

    # authZ
    user_id = get_user_id(authorization)
    verify_project_access(user_id, str(project_id))
    verify_file_access(str(project_id), str(asset_id))

    logger.info(f"Starting compilation for project {project_id}, asset {asset_id}", extra={"request_id": request_id})

    if not check_tectonic_available():
        logger.error("Tectonic not available", extra={"request_id": request_id})
        raise HTTPException(status_code=503, detail="Tectonic LaTeX engine is not available")

    files_service = FilesService(supabase)

    try:
        pdf_bytes, error = compile_project_asset(
            project_id, asset_id, files_service, timeout=request.timeout or settings.default_timeout
        )

        if error or not pdf_bytes:
            error_id = f"ERR-{request_id[:8]}"
            logger.error(
                f"LaTeX compilation failed: {error_id}",
                extra={"request_id": request_id, "error_id": error_id, "detail": error},
            )
            detail = error[:1000] + "..." if error and len(error) > 1000 else (error or "Unknown error")
            raise HTTPException(
                status_code=400,
                detail=f"LaTeX compilation failed (Error ID: {error_id}):\n{detail}",
            )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'inline; filename="compiled.pdf"',
                "X-Request-ID": request_id,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        error_id = f"ERR-{request_id[:8]}"
        logger.error(
            f"Unexpected error during compilation: {str(e)}",
            extra={"request_id": request_id, "error_id": error_id},
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error (Error ID: {error_id})",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower()
    )
