from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel


class CreateFilePayload(BaseModel):
    """Request payload for creating files or folders."""

    parent_id: Optional[UUID] = None
    name: str
    file_type: Literal["folder", "latex", "pdf_source", "asset"]


class MoveFilePayload(BaseModel):
    """Request payload for moving a file or folder within a project."""

    new_parent_id: Optional[UUID] = None


class RenameFilePayload(BaseModel):
    """Request payload for renaming a file or folder."""

    new_name: str


class FileContentPayload(BaseModel):
    """Request payload for overwriting LaTeX or asset file content."""

    content: str


router = APIRouter(prefix="/api", tags=["Files"])


@router.get(
    "/projects/{project_id}/file-tree",
    summary="Fetch project file tree",
    description="Returns a hierarchical file tree compatible with react-arborist.",
)
async def get_file_tree(project_id: UUID):
    pass


@router.post(
    "/projects/{project_id}/files",
    summary="Create file or folder",
    description="Creates a new file or folder entry, mirroring it to disk.",
)
async def create_file(project_id: UUID, payload: CreateFilePayload):
    pass


@router.patch(
    "/files/{file_id}/move",
    summary="Move file or folder",
    description="Changes the parent while enforcing the max depth constraint.",
)
async def move_file(file_id: UUID, payload: MoveFilePayload):
    pass


@router.patch(
    "/files/{file_id}/rename",
    summary="Rename file or folder",
    description="Renames a file or folder both in metadata and on disk.",
)
async def rename_file(file_id: UUID, payload: RenameFilePayload):
    pass


@router.delete(
    "/files/{file_id}",
    summary="Delete file or folder",
    description="Removes metadata and deletes the corresponding disk resource.",
)
async def delete_file(file_id: UUID):
    pass


@router.get(
    "/files/{file_id}/content",
    summary="Read file content",
    description="Returns textual or binary content for the requested file.",
)
async def get_file_content(file_id: UUID):
    pass


@router.put(
    "/files/{file_id}/content",
    summary="Update file content",
    description="Overwrites on-disk content for LaTeX or related text files.",
)
async def update_file_content(file_id: UUID, payload: FileContentPayload):
    pass