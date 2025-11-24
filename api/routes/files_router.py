from uuid import UUID

from fastapi import APIRouter, Header, HTTPException

from db.supabase import supabase
from db.files_service import FilesService

from dto.files_types import (
    FileCreate,
    FileMetadataResponse,
    CreateFilePayload,
    CreateFileResponse,
    UpdateFilePayload,
    FileContentPayload,
    FileTreeResponse
)

from utils.files_utils import (
    build_file_tree
)

from utils.auth import ( 
    verify_file_access,
    verify_project_access,
    get_user_id
)

import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

router = APIRouter(prefix="/api", tags=["Files"])

files_service = FilesService(supabase)

@router.get(
    "/projects/{project_id}/files",
    summary="Get file tree",
    description="Returns the project file listing as a hierarchical tree.",
)
async def get_file_tree(
        project_id: UUID,
        authorization: str = Header(...)
):
    # Authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)

    # Fetch files and build tree
    file_list = files_service.list_files(project_id)
    file_tree = build_file_tree(file_list)
    response = FileTreeResponse(project_id=project_id, file_tree=file_tree)

    return response


@router.post(
    "/projects/{project_id}/files",
    summary="Create file or folder",
    description="Creates a new file or folder entry.",
    response_model=CreateFileResponse
)
async def create_file(
    project_id: UUID,
    payload: CreateFilePayload,
    authorization: str = Header(...)
):
    # authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)
    
    file_create_request = FileCreate(project_id=project_id, **payload.model_dump())

    file_record = files_service.create_file_record(file_create_request)

    # if not inline, generate a presigned upload URL
    if payload.is_inline or payload.asset_type == "folder":
        upload_url = None
    else:
        upload_url = files_service.get_presigned_upload_url(file_record.id, project_id)

    response = CreateFileResponse(
        file_metadata=file_record,
        upload_url=upload_url
    )
    return response


@router.patch(
    "/projects/{project_id}/files/{file_id}",
    summary="Update file metadata",
    description="Renames or moves a file/folder while enforcing hierarchy constraints.",
    response_model=FileMetadataResponse
)
async def update_file(
        project_id: UUID,
        file_id: UUID,
        payload: UpdateFilePayload,
        authorization: str = Header(...)
):
    # authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)
    verify_file_access(project_id, file_id)

    updates = {}

    if payload.new_name:
        updates["name"] = payload.new_name
    if "new_parent_id" in payload.model_dump():
        if payload.new_parent_id is None:
            updates["parent_id"] = None
        else:
            verify_file_access(project_id, payload.new_parent_id)
            new_parent_record = files_service.get_file_record(payload.new_parent_id)
            if new_parent_record.asset_type != "folder":
                raise HTTPException(status_code=400, detail="New parent must be a folder")
            updates["parent_id"] = str(payload.new_parent_id)

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    logger.info("Updating file %s with %s", file_id, updates)
    updated_record = files_service.update_file_record(file_id, updates)
    response = FileMetadataResponse(**updated_record.model_dump())

    return response


@router.delete(
    "/projects/{project_id}/files/{file_id}",
    summary="Delete file or folder",
    description="Removes metadata and deletes the corresponding disk resource.",
    status_code=204
)
async def delete_file(
        project_id: UUID,
        file_id: UUID,
        authorization: str = Header(...)
):
    # authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)
    verify_file_access(project_id, file_id)

    files_service.delete_file_record(file_id)
    

@router.get(
    "/projects/{project_id}/files/{file_id}",
    summary="Get file metadata",
    description="Returns file metadata and a presigned download URL.",
    response_model=FileMetadataResponse
)
async def get_file_metadata(
        project_id: UUID,
        file_id: UUID,
        authorization: str = Header(...)
):
    # authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)
    verify_file_access(project_id, file_id)

    file_record = files_service.get_file_record(file_id)
    if file_record.is_inline or file_record.asset_type == "folder":
        download_url = None
    else:
        download_url = files_service.get_presigned_download_url(file_id, project_id)

    response = FileMetadataResponse(
        **file_record.model_dump(),
        download_url=download_url
    )

    return response


@router.put(
    "/projects/{project_id}/files/{file_id}/content",
    summary="Update file content",
    description="Overwrites on-disk content for LaTeX or related text files.",
    status_code=204
)
async def update_file_content(
        project_id: UUID,
        file_id: UUID,
        payload: FileContentPayload,
        authorization: str = Header(...)
):
    # authenticate and authorize
    user_id = get_user_id(authorization)
    verify_project_access(user_id, project_id)
    verify_file_access(project_id, file_id)

    file_record = files_service.get_file_record(file_id)

    if file_record.is_inline is False:
        raise HTTPException(status_code=400, detail="Cannot update content of non-inline file")

    files_service.update_file_record(file_id, {"content": payload.content})
