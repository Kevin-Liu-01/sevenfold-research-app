"""
LaTeX Compilation Utility using Tectonic

This module provides functions to compile LaTeX source code to PDF using the Tectonic engine.
Designed to work in a microservice architecture.
"""

import subprocess
import tempfile
from pathlib import Path
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def _validate_asset_path(base_path: Path, asset_path: Path) -> Path:
    """
    Validate that asset path is within the base directory to prevent path traversal attacks.
    
    Args:
        base_path: The base temporary directory
        asset_path: The requested asset path (may be relative)
    
    Returns:
        Resolved and validated Path object
    
    Raises:
        ValueError: If the path is outside the base directory
    """
    # Resolve the full path
    resolved = (base_path / asset_path).resolve()
    base_resolved = base_path.resolve()
    
    # Check that resolved path is within base directory
    try:
        resolved.relative_to(base_resolved)
    except ValueError:
        raise ValueError(
            f"Invalid asset path: {asset_path}. Path traversal detected."
        )
    
    return resolved


def compile_latex_to_pdf(
    work_dir: Path,
    entrypoint: str = "main.tex",
    timeout: int = 30,
    request_id: Optional[str] = None
) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Compile LaTeX source code to PDF using Tectonic.
    
    Args:
        tex_content: The LaTeX source code as a string
        assets: Optional dictionary of filename -> file content (for images, .bib files, etc.)
        timeout: Maximum compilation time in seconds
        request_id: Optional request ID for logging correlation
    
    Returns:
        Tuple of (pdf_bytes, error_message)
        - If successful: (pdf_bytes, None)
        - If failed: (None, error_message)
    """
    log_extra = {"request_id": request_id} if request_id else {}
    tmppath = Path(work_dir)
    logger.debug(f"Compiling in existing temp directory {tmppath}", extra=log_extra)

    try:
        tex_file = tmppath / entrypoint
        if not tex_file.exists():
            error_msg = f"Entrypoint {entrypoint} not found in work directory"
            logger.error(error_msg, extra=log_extra)
            return None, error_msg

        result = subprocess.run(
            ["tectonic", "-X", "compile", entrypoint, "--print"],
            cwd=tmppath,
            capture_output=True,
            timeout=timeout,
            text=True,
        )

        if result.returncode == 0:
            pdf_path = tmppath / "build" / Path(entrypoint).with_suffix(".pdf").name
            if not pdf_path.exists():
                pdf_path = tmppath / Path(entrypoint).with_suffix(".pdf").name

            if pdf_path.exists():
                pdf_bytes = pdf_path.read_bytes()
                logger.info(
                    f"Successfully compiled PDF ({len(pdf_bytes)} bytes)",
                    extra=log_extra,
                )
                return pdf_bytes, None
            else:
                error_msg = "Compilation succeeded but PDF not found"
                logger.error(error_msg, extra=log_extra)
                return None, error_msg

        error_output = _format_compilation_error(result.stderr, result.stdout)
        logger.warning(
            f"Compilation failed: {error_output[:200]}...",
            extra=log_extra,
        )
        return None, error_output
            
    except subprocess.TimeoutExpired:
        error_msg = f"Compilation timeout ({timeout}s exceeded). Document may be too complex."
        logger.error(error_msg, extra=log_extra)
        return None, error_msg
        
    except FileNotFoundError:
        error_msg = (
            "Tectonic not found. Please ensure Tectonic is installed.\n\n"
            "Installation:\n"
            "- macOS: brew install tectonic\n"
            "- Linux: curl --proto '=https' --tlsv1.2 -fsSL "
            "https://drop-sh.fullyjustified.net | sh\n"
            "- Docker: Already included in Dockerfile"
        )
        logger.error(error_msg, extra=log_extra)
        return None, error_msg
        
    except ValueError as e:
        # Path validation errors
        error_msg = f"Invalid asset path: {str(e)}"
        logger.error(error_msg, extra=log_extra)
        return None, error_msg
        
    except subprocess.SubprocessError as e:
        # Subprocess-specific errors
        error_msg = f"Subprocess error during compilation: {str(e)}"
        logger.error(error_msg, extra=log_extra, exc_info=True)
        return None, error_msg
        
    except OSError as e:
        # File system errors
        error_msg = f"File system error during compilation: {str(e)}"
        logger.error(error_msg, extra=log_extra, exc_info=True)
        return None, error_msg
        
    except Exception as e:
        # Catch-all for unexpected errors
        error_msg = f"Unexpected compilation error: {str(e)}"
        logger.error(error_msg, extra=log_extra, exc_info=True)
        return None, error_msg


def _format_compilation_error(stderr: str, stdout: str, max_length: int = 5000) -> str:
    """
    Format error messages from Tectonic output for user-friendly display.
    Truncates long error messages to prevent DoS via large error responses.
    
    Args:
        stderr: Standard error output from Tectonic
        stdout: Standard output from Tectonic
        max_length: Maximum length of formatted error message
    
    Returns:
        Formatted error message (truncated if necessary)
    """
    error_lines = []
    
    if stderr:
        error_lines.append("=== Compilation Errors ===\n")
        error_lines.append(stderr)
    
    if stdout:
        error_lines.append("\n=== Additional Output ===\n")
        error_lines.append(stdout)
    
    if not error_lines:
        return "Unknown compilation error (no output)"
    
    error_msg = "".join(error_lines)
    
    # Truncate if too long
    if len(error_msg) > max_length:
        error_msg = error_msg[:max_length] + f"\n... (truncated, original length: {len(''.join(error_lines))} chars)"
    
    return error_msg


def check_tectonic_available() -> bool:
    """
    Check if Tectonic is installed and available.
    
    Returns:
        Boolean indicating if Tectonic is available
    """
    try:
        result = subprocess.run(
            ["tectonic", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return result.returncode == 0
            
    except FileNotFoundError:
        logger.debug("Tectonic not found in PATH")
        return False
    except subprocess.TimeoutExpired:
        logger.warning("Timeout while checking Tectonic availability")
        return False
    except Exception as e:
        logger.error(f"Error checking Tectonic: {str(e)}", exc_info=True)
        return False
