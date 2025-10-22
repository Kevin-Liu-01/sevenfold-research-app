"""
LaTeX Compilation Utility using Tectonic

For Azure deployment, we have several options:
1. Use Docker container with Tectonic installed (recommended for production)
2. Use Azure Container Instances for on-demand compilation
3. Use external LaTeX compilation service (Overleaf API, LaTeX.Online, etc.)

For development, Tectonic should be installed locally.
For production on Azure, the Dockerfile will include Tectonic installation.
"""

import subprocess
import tempfile
import os
from pathlib import Path
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)


def compile_latex_to_pdf(
    tex_content: str, 
    assets: Optional[Dict[str, bytes]] = None,
    timeout: int = 30
) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Compile LaTeX source code to PDF using Tectonic.
    
    Args:
        tex_content: The LaTeX source code as a string
        assets: Optional dictionary of filename -> file content (for images, .bib files, etc.)
        timeout: Maximum compilation time in seconds
    
    Returns:
        Tuple of (pdf_bytes, error_message)
        - If successful: (pdf_bytes, None)
        - If failed: (None, error_message)
    
    Example:
        >>> pdf, error = compile_latex_to_pdf(r'''
        ... \\documentclass{article}
        ... \\begin{document}
        ... Hello World!
        ... \\end{document}
        ... ''')
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        
        try:
            # Write main .tex file
            tex_file = tmppath / "main.tex"
            tex_file.write_text(tex_content, encoding='utf-8')
            logger.debug(f"Wrote main.tex ({len(tex_content)} chars)")
            
            # Write additional assets (images, bibliography files, etc.)
            if assets:
                for filename, content in assets.items():
                    asset_path = tmppath / filename
                    # Ensure subdirectories exist
                    asset_path.parent.mkdir(parents=True, exist_ok=True)
                    asset_path.write_bytes(content)
                    logger.debug(f"Wrote asset: {filename} ({len(content)} bytes)")
            
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
                    logger.info(f"Successfully compiled PDF ({len(pdf_bytes)} bytes)")
                    return pdf_bytes, None
                else:
                    error_msg = "Compilation succeeded but PDF not found"
                    logger.error(error_msg)
                    return None, error_msg
            
            # Compilation failed - extract error information
            error_output = _format_compilation_error(result.stderr, result.stdout)
            logger.warning(f"Compilation failed: {error_output[:200]}...")
            return None, error_output
            
        except subprocess.TimeoutExpired:
            error_msg = f"Compilation timeout ({timeout}s exceeded). Document may be too complex."
            logger.error(error_msg)
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
            logger.error(error_msg)
            return None, error_msg
            
        except Exception as e:
            error_msg = f"Unexpected compilation error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return None, error_msg


def _format_compilation_error(stderr: str, stdout: str) -> str:
    """
    Format error messages from Tectonic output for user-friendly display.
    
    Args:
        stderr: Standard error output from Tectonic
        stdout: Standard output from Tectonic
    
    Returns:
        Formatted error message
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
    
    return "".join(error_lines)


def check_tectonic_available() -> Tuple[bool, str]:
    """
    Check if Tectonic is installed and available.
    
    Returns:
        Tuple of (is_available, version_or_error_message)
    """
    try:
        result = subprocess.run(
            ["tectonic", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            version = result.stdout.strip()
            return True, version
        else:
            return False, "Tectonic found but version check failed"
            
    except FileNotFoundError:
        return False, "Tectonic not installed"
    except Exception as e:
        return False, f"Error checking Tectonic: {str(e)}"
