from fastapi import APIRouter, UploadFile, Form, HTTPException, Header
from supabase import create_client
import os
import uuid
from typing import Literal
import aiofiles
import tempfile
import jwt

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_user_id_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload-paper")
async def upload_paper(
    file: UploadFile,
    project_id: str = Form(...),
    paper_type: Literal["source", "candidate"] = Form(...),
    authorization: str = Header(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)

    # Save file temporarily
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    path = f"{project_id}/{file_name}"

    try:
        # Read bytes and upload to Supabase storage
        file_bytes = await file.read()
        upload_response = supabase.storage.from_("papers").upload(path, file_bytes, {
            "content-type": "application/pdf"
        })

        if upload_response.get("error"):
            raise HTTPException(status_code=500, detail="Storage upload failed")

        public_url = supabase.storage.from_("papers").get_public_url(path).get("publicUrl")

        # Insert metadata into `papers` table
        insert_response = supabase.from_("papers").insert({
            "project_id": project_id,
            "file_url": public_url,
            "filename": file.filename,
            "type": paper_type
        }).execute()

        if insert_response.error:
            raise HTTPException(status_code=500, detail=insert_response.error.message)

        return {"status": "success", "url": public_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
