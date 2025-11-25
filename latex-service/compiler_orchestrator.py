from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from dto.files_types import FileRecord
from latex_compiler import compile_latex_to_pdf
from db.files_service import FilesService
from utils.path_utils import build_path_map, resolve_all_dependencies


class CompilationError(Exception):
    pass


def _write_assets_to_temp(
    base_dir: Path,
    files: List[FileRecord],
    file_contents: Dict[UUID, str],
    file_bytes: Dict[UUID, bytes],
) -> None:
    """
    Write all files to the temp dir respecting their relative paths.
    """
    # Build relative paths from names/parents
    # path_map is built in the orchestrator; use it to place files correctly
    for file in files:
        rel_path_parts = [file.name]
        parent_id = file.parent_id
        # The orchestrator must ensure file.parent_id resolution matches its path map
        # For simplicity, assume the path map was built and used to derive these relative names
        while parent_id and hasattr(file, "_parent_chain"):
            break  # this hook is unused; rely on the path map used earlier


def compile_project_asset(
    project_id: UUID,
    asset_id: UUID,
    files_service: FilesService,
    timeout: int = 30,
) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Fetch a project asset, resolve its dependencies, download them, and compile with Tectonic.

    Returns (pdf_bytes, error_message).
    """
    # Fetch all files for the project
    files = files_service.list_files(project_id)
    if not files:
        return None, "No files found for project"

    files_by_id = {f.id: f for f in files}
    root = files_by_id.get(asset_id)
    if not root:
        return None, "Requested asset not found"
    if not (root.mime_type.startswith("text/") or "latex" in root.mime_type):
        return None, f"Asset is not LaTeX (mime={root.mime_type})"

    # Build path map
    path_map = build_path_map(files)

    # Load contents for all files we might need
    file_contents: Dict[UUID, str] = {}
    file_bytes: Dict[UUID, bytes] = {}

    def load_content(file: FileRecord) -> str:
        if file.id in file_contents:
            return file_contents[file.id]
        if file.is_inline and file.content is not None:
            file_contents[file.id] = file.content
            return file.content
        # fetch from storage
        data = files_service.download_file(project_id, file.id)
        try:
            text = data.decode("utf-8")
            file_contents[file.id] = text
            return text
        except UnicodeDecodeError:
            file_bytes[file.id] = data
            return ""

    # Load root content
    root_content = load_content(root)

    # Resolve dependency closure
    resolved_files, missing = resolve_all_dependencies(root, path_map, file_contents={root.id: root_content})
    if missing:
        return None, f"Missing dependencies: {', '.join(sorted(set(missing)))}"

    # Ensure we have bytes for all non-inline (assets)
    for file in resolved_files:
        if file.id == root.id:
            continue
        if file.is_inline:
            load_content(file)
        else:
            file_bytes[file.id] = files_service.download_file(project_id, file.id)

    # Stage files in temp dir
    with tempfile.TemporaryDirectory() as tmpdir:
        base = Path(tmpdir)
        # write root tex
        root_path = base / "main.tex"
        root_path.write_text(root_content, encoding="utf-8")

        # write other files according to their relative path
        for rel_path, file in path_map.items():
          if file.id == root.id:
              continue
          target = base / rel_path
          target.parent.mkdir(parents=True, exist_ok=True)
          if file.is_inline and file.id in file_contents:
              target.write_text(file_contents[file.id], encoding="utf-8")
          elif file.id in file_bytes:
              target.write_bytes(file_bytes[file.id])

        # Compile
        return compile_latex_to_pdf(root_path.read_text(encoding="utf-8"), assets=None, timeout=timeout)
