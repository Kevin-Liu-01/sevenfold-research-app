from typing import Literal, Optional, List
from uuid import UUID
from pydantic import BaseModel

class FileRecord(BaseModel):
    """Pydantic model representing a file record."""

    id: UUID
    project_id: UUID
    asset_type: Literal["folder", "file"]
    mime_type: str
    is_inline:  bool
    parent_id: Optional[UUID]
    name: str
    upload_status: Optional[Literal["pending", "done", "failed"]] = None
    content: Optional[str]

class FileTreeNode(FileRecord):
    """Node in the file tree structure."""

    children: Optional[List['FileTreeNode']] = None

