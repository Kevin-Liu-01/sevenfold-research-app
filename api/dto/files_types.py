from typing import Literal, Optional, List
from uuid import UUID
from pydantic import BaseModel

class FileCreate(BaseModel):
    """Pydantic model representing a file creation request."""

    project_id: UUID
    asset_type: Literal["folder", "file"]
    mime_type: str
    is_inline:  bool
    parent_id: Optional[UUID]
    name: str


class FileRecord(FileCreate):
    """Pydantic model representing a file record."""

    content: Optional[str]
    id: UUID


class CreateFilePayload(BaseModel):
    """Request payload for creating files or folders."""

    parent_id: Optional[UUID] = None
    name: str
    asset_type: Literal["folder", "file"]
    mime_type: str
    is_inline: bool

class CreateFileResponse(BaseModel):
    """Response payload for file creation including upload URL if applicable."""

    file_metadata: FileRecord
    upload_url: Optional[str] = None

class UpdateFilePayload(BaseModel):
    """Request payload for updating file metadata (rename/move)."""

    new_parent_id: Optional[UUID] = None
    new_name: Optional[str] = None


class FileContentPayload(BaseModel):
    """Request payload for overwriting LaTeX or text file content."""

    content: str


class FileMetadataResponse(FileRecord):
    """Response payload for file metadata along with a download URL."""

    download_url: Optional[str] = None


class FileTreeNode(FileRecord):
    """Node in the file tree structure."""

    children: Optional[List['FileTreeNode']] = None

 
class FileTreeResponse(BaseModel):
    """Response payload representing the file tree structure."""

    project_id: UUID
    file_tree: List[FileTreeNode]
