from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Union
import logging
import sys
import base64
from latex_compiler import compile_latex_to_pdf, check_tectonic_available
from config import settings
from middleware import request_id_middleware, auth_middleware, rate_limit_middleware

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
    """Request model for LaTeX compilation."""
    tex_content: str = Field(
        ...,
        min_length=1,
        max_length=settings.max_tex_content_size,
        description="LaTeX source code to compile"
    )
    assets: Optional[Dict[str, Union[str, bytes]]] = Field(
        None,
        description="Optional dictionary of asset files (filename -> base64-encoded string or bytes)"
    )
    timeout: Optional[int] = Field(
        default=settings.default_timeout,
        ge=settings.min_timeout,
        le=settings.max_timeout,
        description=f"Compilation timeout in seconds (min: {settings.min_timeout}, max: {settings.max_timeout})"
    )
    
    @validator('tex_content')
    def validate_content(cls, v):
        """Validate that LaTeX content is not empty."""
        if not v or not v.strip():
            raise ValueError("LaTeX content cannot be empty")
        return v
    
    @validator('assets')
    def validate_and_decode_assets(cls, v):
        """Validate assets and decode base64 strings to bytes."""
        if not v:
            return v
        
        decoded_assets = {}
        total_size = 0
        
        for filename, content in v.items():
            # Decode base64 strings to bytes
            if isinstance(content, str):
                try:
                    content = base64.b64decode(content)
                except Exception as e:
                    raise ValueError(f"Invalid base64 encoding for asset '{filename}': {str(e)}")
            elif not isinstance(content, bytes):
                raise ValueError(f"Asset '{filename}' must be base64-encoded string or bytes")
            
            decoded_assets[filename] = content
            total_size += len(content)
        
        # Validate total size
        if total_size > settings.max_assets_total_size:
            raise ValueError(
                f"Total assets size ({total_size} bytes) exceeds maximum "
                f"({settings.max_assets_total_size} bytes)"
            )
        
        return decoded_assets
    
    class Config:
        json_schema_extra = {
            "example": {
                "tex_content": "\\documentclass{article}\\begin{document}Hello World\\end{document}",
                "assets": None,
                "timeout": 30
            }
        }


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


@app.post("/compile")
async def compile_latex(
    http_request: Request,
    request: CompileRequest
):
    """
    Compile LaTeX source code to PDF.
    
    Args:
        request: Compilation request with LaTeX content, optional assets, and timeout
        http_request: FastAPI request object for accessing request ID
        body: Raw request body for size validation
    
    Returns:
        PDF file as application/pdf or error details
    
    Raises:
        HTTPException: If compilation fails or service is unavailable
    """
    request_id = getattr(http_request.state, 'request_id', 'unknown')
    logger.info(
        f"Received LaTeX compilation request",
        extra={"request_id": request_id, "content_length": len(request.tex_content)}
    )
    
    # Check if Tectonic is available
    if not check_tectonic_available():
        logger.error("Tectonic not available", extra={"request_id": request_id})
        raise HTTPException(
            status_code=503,
            detail="Tectonic LaTeX engine is not available"
        )
    
    # Compile the LaTeX to PDF
    try:
        pdf_bytes, error = compile_latex_to_pdf(
            request.tex_content,
            assets=request.assets,
            timeout=request.timeout or settings.default_timeout,
            request_id=request_id
        )
        
        if error:
            # Sanitize error message to prevent information leakage
            error_id = f"ERR-{request_id[:8]}"
            logger.error(
                f"LaTeX compilation failed: {error_id}",
                extra={"request_id": request_id, "error_id": error_id}
            )
            
            # Truncate long error messages
            error_detail = error[:1000] + "..." if len(error) > 1000 else error
            raise HTTPException(
                status_code=400,
                detail=f"LaTeX compilation failed (Error ID: {error_id}):\n{error_detail}"
            )
        
        logger.info(
            f"LaTeX compilation successful",
            extra={"request_id": request_id, "pdf_size": len(pdf_bytes)}
        )
        
        # Return PDF directly
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'inline; filename="compiled.pdf"',
                "X-Request-ID": request_id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        error_id = f"ERR-{request_id[:8]}"
        logger.error(
            f"Unexpected error during compilation: {str(e)}",
            extra={"request_id": request_id, "error_id": error_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error (Error ID: {error_id})"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower()
    )
