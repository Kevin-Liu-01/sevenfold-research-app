from uuid import UUID
from pydantic import BaseModel
from typing import Optional

class ProjectCreate(BaseModel):
    """Pydantic model representing a project creation request."""

    name: str
    description: Optional[str] = None
    owner_id: UUID

class CreateProjectPayload(BaseModel):
    """Request payload for creating a new project."""

    name: str


