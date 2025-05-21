from fastapi import APIRouter, UploadFile, Form, HTTPException, Header
from typing import Literal
import uuid

from db.supabase import supabase
from utils.auth import get_user_id_from_token

router = APIRouter()

@router.post("/upload-paper")
async def upload_paper(
    file: UploadFile,
    project_id: str = Form(...),
    paper_type: Literal["source", "candidate"] = Form(...),
    authorization: str = Header(...)
):
    # Ensure file is PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Get user ID from JWT
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)

    # Verify that the project exists and belongs to the user
    project_check = (
        supabase.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not project_check.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    # Generate unique file path
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    path = f"{project_id}/{file_name}"

    try:
        file_bytes = await file.read()

        # Upload file to Supabase Storage (private bucket, no public URL)
        upload_response = (
            supabase.storage.from_("papers")
            .upload(
                path=path, 
                file=file_bytes, 
                file_options={"content-type": "application/pdf"}
            )
        )

        signed_url = (
            supabase.storage.from_("papers")
            .create_signed_url(
                path, expires_in=604800
            )
            .get("signedURL")
        )

        # Insert paper metadata with signed URL
        insert_response = supabase.table("papers").insert({
            "project_id": project_id,
            "user_id": user_id,
            "file_url": signed_url,
            "filename": file.filename,
            "type": paper_type
        }).execute()

        return {"status": "success", "signed_url": signed_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

