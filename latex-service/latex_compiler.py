"""
LaTeX Compilation Utility using Tectonic

This module provides functions to compile LaTeX source code to PDF using the Tectonic engine.
Designed to work in a microservice architecture.
"""

import subprocess
import tempfile
import os
from pathlib import Path
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)


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
    tex_content: str, 
    assets: Optional[Dict[str, bytes]] = None,
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
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        
        try:
            # Write main .tex file
            tex_file = tmppath / "main.tex"
            tex_file.write_text(tex_content, encoding='utf-8')
            logger.debug(f"Wrote main.tex ({len(tex_content)} chars)", extra=log_extra)
            
            # Write additional assets (images, bibliography files, etc.)
            if assets:
                for filename, content in assets.items():
                    # Validate filename to prevent path traversal
                    if not filename or not isinstance(filename, str):
                        raise ValueError(f"Invalid asset filename: {filename}")
                    
                    # Validate and sanitize path
                    asset_path = _validate_asset_path(tmppath, Path(filename))
                    
                    # Ensure subdirectories exist
                    asset_path.parent.mkdir(parents=True, exist_ok=True)
                    asset_path.write_bytes(content)
                    logger.debug(
                        f"Wrote asset: {filename} ({len(content)} bytes)",
                        extra=log_extra
                    )
            
            # Run Tectonic compilation
            # -X compile: Use modern compilation mode
            # --keep-logs: Preserve log files for debugging
            result = subprocess.run(
                ["tectonic", "-X", "compile", "main.tex", "--keep-logs"],
                cwd=tmppath,
                capture_output=True,
                timeout=timeout,
                text=True
            )
            
            # Check if compilation was successful
            if result.returncode == 0:
                # Tectonic outputs to build/ directory by default in -X mode
                pdf_path = tmppath / "build" / "main.pdf"
                
                if not pdf_path.exists():
                    # Fallback: check root directory
                    pdf_path = tmppath / "main.pdf"
                
                if pdf_path.exists():
                    pdf_bytes = pdf_path.read_bytes()
                    logger.info(
                        f"Successfully compiled PDF ({len(pdf_bytes)} bytes)",
                        extra=log_extra
                    )
                    return pdf_bytes, None
                else:
                    error_msg = "Compilation succeeded but PDF not found"
                    logger.error(error_msg, extra=log_extra)
                    return None, error_msg
            
            # Compilation failed - extract error information
            error_output = _format_compilation_error(result.stderr, result.stdout)
            logger.warning(
                f"Compilation failed: {error_output[:200]}...",
                extra=log_extra
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
