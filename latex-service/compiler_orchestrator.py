from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from dto.files_types import FileRecord
from latex_compiler import compile_latex_to_pdf
from db.files_service import FilesService
from utils.path_utils import build_path_map, resolve_all_dependencies

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class CompilationError(Exception):
    pass


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
    if not (root.mime_type.startswith("text/") or "latex" in (root.mime_type or "")):
        return None, f"Asset is not LaTeX (mime={root.mime_type})"

    # Build path map
    path_map = build_path_map(files)

    # Load contents for needed files
    file_contents: Dict[UUID, str] = {}
    file_bytes: Dict[UUID, bytes] = {}

    def load_content(file: FileRecord) -> str:
        if file.id in file_contents:
            return file_contents[file.id]
        if file.is_inline and file.content is not None:
            file_contents[file.id] = file.content
            return file.content
        data = files_service.download_file(project_id, file.id)
        try:
            text = data.decode("utf-8")
            file_contents[file.id] = text
            return text
        except UnicodeDecodeError:
            file_bytes[file.id] = data
            return ""

    root_content = load_content(root)

    resolved_files, missing = resolve_all_dependencies(
        root, path_map, file_contents={root.id: root_content}
    )
    if missing:
        return None, f"Missing dependencies: {', '.join(sorted(set(missing)))}"

    logger.debug(f"Dependencies: {[f.name for f in resolved_files]}")
    for file in resolved_files:
        if file.id == root.id:
            continue
        if file.is_inline:
            load_content(file)
        else:
            file_bytes[file.id] = files_service.download_file(project_id, file.id)

    with tempfile.TemporaryDirectory() as tmpdir:
        base = Path(tmpdir)
        root_path = base / "main.tex"
        root_path.write_text(root_content, encoding="utf-8")

        for rel_path, file in path_map.items():
            if file.id == root.id:
                continue
            target = base / rel_path
            target.parent.mkdir(parents=True, exist_ok=True)
            if file.is_inline and file.id in file_contents:
                target.write_text(file_contents[file.id], encoding="utf-8")
            elif file.id in file_bytes:
                target.write_bytes(file_bytes[file.id])

        return compile_latex_to_pdf(base, entrypoint="main.tex", timeout=timeout)
