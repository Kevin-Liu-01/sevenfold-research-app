from __future__ import annotations

from pathlib import PurePosixPath
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from dto.files_types import FileRecord
from utils.dependency_parser import extract_dependencies


def build_path_map(files: List[FileRecord]) -> Dict[str, FileRecord]:
    """
    Build a map of relative LaTeX paths (e.g., sections/intro.tex) to FileRecords.
    Uses parent_id/name to assemble the path; roots live at their filename.
    """
    by_id = {f.id: f for f in files}
    path_map: Dict[str, FileRecord] = {}

    for file in files:
        parts = [file.name]
        parent_id = file.parent_id
        while parent_id:
            parent = by_id.get(parent_id)
            if not parent:
                break
            parts.append(parent.name)
            parent_id = parent.parent_id
        rel_path = "/".join(reversed(parts))
        path_map[rel_path] = file
    return path_map


def resolve_dependencies_for_root(root_content: str, path_map: Dict[str, FileRecord]) -> List[FileRecord]:
    """
    Parse root content for dependencies and return the matching FileRecords.
    Only dependencies that exist in the path map are returned.
    """
    deps: List[FileRecord] = []
    for dep in extract_dependencies(root_content):
        # Normalize to posix path to match map keys
        dep_path = str(PurePosixPath(dep))
        match = path_map.get(dep_path)
        if match:
            deps.append(match)
    return deps


def resolve_all_dependencies(
    root: FileRecord,
    files_by_path: Dict[str, FileRecord],
    file_contents: Dict[UUID, str],
) -> Tuple[List[FileRecord], List[str]]:
    """
    Recursively resolve dependencies starting from root, returning a list of FileRecords
    in traversal order and a list of missing dependency paths.
    """
    resolved: List[FileRecord] = []
    missing: List[str] = []
    visited = set()

    def walk(file: FileRecord):
        if file.id in visited:
            return
        visited.add(file.id)
        resolved.append(file)
        content = file_contents.get(file.id)
        if not content:
            return
        for dep in extract_dependencies(content):
            dep_path = str(PurePosixPath(dep))
            dep_file = files_by_path.get(dep_path)
            if dep_file:
                walk(dep_file)
            else:
                missing.append(dep_path)

    walk(root)
    return resolved, missing
