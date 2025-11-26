from typing import List, Optional

from fastapi import HTTPException

from dto.files_types import (
    CreateFilePayload,
    FileRecord,
    FileTreeNode,
)

LATEX_MIME = "text/x-tex"
MAX_INLINE_BYTES = 2_000_000


def is_latex_mime(mime_type: Optional[str]) -> bool:
    return (mime_type or "").lower() == LATEX_MIME

def validate_new_file_payload(
    payload: CreateFilePayload,
    parent: Optional[FileRecord],
) -> None:
    """Validate creation rules for LaTeX/text assets and hierarchy constraints."""
    if is_latex_mime(payload.mime_type):
        if payload.asset_type != "file":
            raise HTTPException(status_code=400, detail="LaTeX files must use asset_type=file")
        if not payload.is_inline:
            raise HTTPException(status_code=400, detail="LaTeX files must be inline; uploads are not supported")
    if parent and parent.asset_type != "folder":
        raise HTTPException(status_code=400, detail="Parent must be a folder")

def ensure_content_update_allowed(file_record: FileRecord, content: str) -> None:
    """Validate that a content write is allowed for this record."""
    if not is_latex_mime(file_record.mime_type):
        raise HTTPException(status_code=400, detail="Only LaTeX inline files can be updated via this endpoint")
    if not file_record.is_inline:
        raise HTTPException(status_code=400, detail="Cannot update content of a non-inline file")
    if len(content.encode("utf-8")) > MAX_INLINE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Content too large; limit is {MAX_INLINE_BYTES} bytes for LaTeX files",
        )


def build_file_tree(file_list: List[FileRecord]) -> List[FileTreeNode]:
    """Builds a hierarchical file tree from a flat list of file records."""
    file_dict = dict()
    tree = []

    # First, create all nodes and store them in a dictionary
    for file in file_list:
        node = FileTreeNode(**file.model_dump(), children=[])
        file_dict[file.id] = node

    # Then, link nodes to their parents. If no parent, it's a root node.
    for file in file_list:
        if file.parent_id is None:
            tree.append(file_dict[file.id])
        else:
            file_dict[file.parent_id].children.append(file_dict[file.id])

    tree.sort(key=lambda x: x.asset_type == "folder", reverse=True)

    return tree
