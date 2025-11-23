from uuid import UUID

from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel


class CreateProjectPayload(BaseModel):
    """Request payload for creating a new project."""

    name: str


router = APIRouter(prefix="/api", tags=["Projects"])


@router.get(
    "/projects",
    summary="List projects",
    description="Returns all projects for the single local user.",
)
async def list_projects():
    pass


@router.post(
    "/projects",
    summary="Create project",
    description="Creates a new project and corresponding storage directory.",
)
async def create_project(payload: CreateProjectPayload):
    pass


@router.get(
    "/projects/{project_id}",
    summary="Get project metadata",
    description="Fetches metadata for the specified project.",
)
async def get_project(project_id: UUID):
    pass


@router.delete(
    "/projects/{project_id}",
    summary="Delete project",
    description="Deletes project metadata plus its storage directory.",
)
async def delete_project(project_id: UUID):
    pass


@router.post(
    "/projects/{project_id}/upload-pdf",
    summary="Upload library PDF",
    description="Stores the PDF under library_pdfs and schedules indexing.",
    tags=["Library"],
)
async def upload_pdf(project_id: UUID, pdf: UploadFile = File(...)):
    pass


@router.post(
    "/files/{file_id}/reindex",
    summary="Reindex library PDF",
    description="Retries extraction/embedding for PDFs that previously failed indexing.",
    tags=["Library"],
)
async def reindex_pdf(file_id: UUID):
    pass