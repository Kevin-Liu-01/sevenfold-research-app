from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from latex_compiler import compile_latex_to_pdf, check_tectonic_available

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LaTeX Compiler Service",
    description="Microservice for compiling LaTeX documents to PDF using Tectonic",
    version="1.0.0"
)


class CompileRequest(BaseModel):
    tex_content: str
    assets: Optional[Dict[str, Any]] = None
    timeout: Optional[int] = 30


class HealthResponse(BaseModel):
    status: str
    tectonic_available: bool
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify service is running and Tectonic is available."""
    tectonic_available = check_tectonic_available()
    return HealthResponse(
        status="healthy" if tectonic_available else "degraded",
        tectonic_available=tectonic_available,
        version="1.0.0"
    )


@app.post("/compile")
async def compile_latex(request: CompileRequest):
    """
    Compile LaTeX source code to PDF.
    
    Args:
        tex_content: The LaTeX source code
        assets: Optional dictionary of asset files (images, .bib files, etc.)
        timeout: Compilation timeout in seconds (default: 30)
    
    Returns:
        PDF file as application/pdf or error details
    """
    logger.info("Received LaTeX compilation request")
    
    if not request.tex_content or not request.tex_content.strip():
        raise HTTPException(
            status_code=400,
            detail="LaTeX content cannot be empty"
        )
    
    # Check if Tectonic is available
    if not check_tectonic_available():
        raise HTTPException(
            status_code=503,
            detail="Tectonic LaTeX engine is not available"
        )
    
    # Compile the LaTeX to PDF
    pdf_bytes, error = compile_latex_to_pdf(
        request.tex_content,
        assets=request.assets,
        timeout=request.timeout
    )
    
    if error:
        logger.error(f"LaTeX compilation failed: {error}")
        raise HTTPException(
            status_code=400,
            detail=f"LaTeX compilation failed:\n{error}"
        )
    
    logger.info("LaTeX compilation successful")
    
    # Return PDF directly
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'inline; filename="compiled.pdf"'
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
