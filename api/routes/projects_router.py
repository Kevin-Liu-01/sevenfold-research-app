from uuid import UUID

from fastapi import APIRouter, File, UploadFile, Header, HTTPException

from db.supabase import supabase
from db.library_service import LibraryService

from dto.projects_types import (
    CreateProjectPayload,
    ProjectCreate
)
from dto.library_types import (
    LibraryDocumentsResponse,
    LibraryDocument,
    LibraryDocumentUpdatePayload
)

from utils.auth import (
    get_user_id,
    verify_project_access
)
from db.vector_store_service import VectorStoreService

router = APIRouter(prefix="/api", tags=["Projects"])

# Initialize services with vector store support
vector_store_service = VectorStoreService()
library_service = LibraryService(supabase, vector_store_service=vector_store_service)


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
async def create_project(
    payload: CreateProjectPayload,
    authorization: str = Header(...)
):
    # authenticate
    user_id = get_user_id(authorization)

    # Create project in database
    project_data = {
        "name": payload.name,
        "owner_id": user_id,
    }

    response = supabase.table("projects").insert(project_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create project")

    return response.data[0]


@router.get(
    "/projects/{project_id}",
    summary="Get project metadata",
    description="Fetches metadata for the specified project.",
)
async def get_project(
    project_id: UUID,
    authorization: str = Header(...)
):
    # authenticate
    user_id = get_user_id(authorization)

    # Verify project access
    verify_project_access(user_id, str(project_id))

    # Fetch project
    response = (
        supabase
        .table("projects")
        .select("*")
        .eq("id", str(project_id))
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")

    return response.data


@router.delete(
    "/projects/{project_id}",
    summary="Delete project",
    description="Deletes project metadata plus its storage directory.",
)
async def delete_project(project_id: UUID):
    pass


@router.get(
    "/projects/{project_id}/library",
    summary="List library documents",
    response_model=LibraryDocumentsResponse,
)
async def list_library_documents(
    project_id: UUID,
    authorization: str = Header(...)
):
    user_id = get_user_id(authorization)
    verify_project_access(user_id, str(project_id))

    documents = library_service.list_documents(project_id)
    return LibraryDocumentsResponse(project_id=project_id, documents=documents)


@router.post(
    "/projects/{project_id}/upload-pdf",
    summary="Upload library PDF",
    description="Stores the PDF in Supabase Storage and records metadata.",
    tags=["Library"],
    response_model=LibraryDocument
)
async def upload_pdf(
    project_id: UUID,
    pdf: UploadFile = File(...),
    authorization: str = Header(...)
):
    user_id = get_user_id(authorization)
    verify_project_access(user_id, str(project_id))

    if pdf.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported")

    file_bytes = await pdf.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    document = library_service.create_document_from_upload(
        project_id=project_id,
        upload_bytes=file_bytes,
        original_filename=pdf.filename or "document.pdf",
        content_type=pdf.content_type or "application/pdf",
    )
    return document


@router.patch(
    "/projects/{project_id}/library/{document_id}",
    summary="Rename library document",
    tags=["Library"],
    response_model=LibraryDocument
)
async def rename_library_document(
    project_id: UUID,
    document_id: UUID,
    payload: LibraryDocumentUpdatePayload,
    authorization: str = Header(...)
):
    user_id = get_user_id(authorization)
    verify_project_access(user_id, str(project_id))

    updated = library_service.rename_document(
        project_id=project_id,
        document_id=document_id,
        title=payload.title,
    )
    return updated


@router.delete(
    "/projects/{project_id}/library/{document_id}",
    summary="Delete library document",
    tags=["Library"],
    status_code=204
)
async def delete_library_document(
    project_id: UUID,
    document_id: UUID,
    authorization: str = Header(...)
):
    user_id = get_user_id(authorization)
    verify_project_access(user_id, str(project_id))

    library_service.delete_document(project_id=project_id, document_id=document_id)


@router.post(
    "/files/{file_id}/reindex",
    summary="Reindex library PDF",
    description="Retries extraction/embedding for PDFs that previously failed indexing.",
    tags=["Library"],
)
async def reindex_pdf(file_id: UUID):
    pass
