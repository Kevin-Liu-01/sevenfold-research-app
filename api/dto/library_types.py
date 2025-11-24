from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class LibraryDocument(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    original_filename: str
    storage_path: str
    file_size_bytes: int
    content_type: str
    index_status: str
    index_error: Optional[str] = None
    created_at: datetime
    download_url: Optional[str] = None


class LibraryDocumentsResponse(BaseModel):
    project_id: UUID
    documents: List[LibraryDocument]


class LibraryDocumentUpdatePayload(BaseModel):
    title: str

