from uuid import UUID

from fastapi import APIRouter, File, UploadFile, Header
from pydantic import BaseModel

from db.supabase import supabase

from types.projects_types import (
    CreateProjectPayload,
    ProjectCreate
)

from utils.auth import (
    get_user_id,
    verify_project_access
)

router = APIRouter(prefix="/api", tags=["Projects"])


@router.get(
    "/projects",
    summary="List projects",
    description="Returns all projects for the single local user.",
)
async def list_projects(
    authorization: str = Header(...)
):
    # authenticate
    user_id = get_user_id(authorization)

    response = supabase.table("projects").select("*").eq("owner_id", user_id).execute()

    return response.data


@router.post(
    "/projects",
    summary="Create project",
    description="Creates a new project.",
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
