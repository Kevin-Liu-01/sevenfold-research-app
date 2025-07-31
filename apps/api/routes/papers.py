from fastapi import APIRouter, UploadFile, Form, HTTPException, Header, Body
from typing import Literal, List
import uuid

from db.supabase import supabase
from utils.auth import get_user_id_from_token

router = APIRouter(prefix="/papers", tags=["papers"])

def _get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    return get_user_id_from_token(token)


def _verify_project(project_id: str, user_id: str) -> None:
    """Make sure the project exists and belongs to the user."""
    project_check = (
        supabase.table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not project_check.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

@router.post("/upload-paper", status_code=201)
async def upload_paper(
    file: UploadFile,
    project_id: str = Form(...),
    paper_type: Literal["source", "candidate"] = Form(...),
    authorization: str = Header(...),
):
    """
    Upload a PDF and register metadata in the `papers` table.

    Args:
        file: The PDF file to upload.
        project_id: The ID of the project to upload the paper to.
        paper_type: The type of paper to upload.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the status, paper_id, and preview_url.
    """

    # 1. Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # 2. Authenticate & authorise
    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)

    # 3. Build a unique storage path -> <user>/<project>/<uuid>.pdf
    file_name = f"{uuid.uuid4()}.pdf"
    storage_path = f"{user_id}/{project_id}/{file_name}"

    try:
        file_bytes = await file.read()

        # 4. Upload to Supabase Storage (private bucket)
        upload_resp = supabase.storage.from_("papers").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf"},
        )


        # 5. Immediate preview link (1 day)
        preview_resp = supabase.storage.from_("papers").create_signed_url(
            storage_path,
            expires_in=60 * 60 * 24,  # 1 day
        )

        # 6. Persist metadata
        insert_resp = supabase.table("papers").insert(
            {
                "project_id": project_id,
                "user_id": user_id,
                "storage_path": storage_path,
                "filename": file.filename,
                "type": paper_type,
            }
        ).execute()

        paper_id = insert_resp.data[0]["id"]

        return {
            "status": "success",
            "paper_id": paper_id,
            "preview_url": preview_resp["signedURL"],
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")

@router.get("/{paper_id}/signed-url")
def get_signed_url(
    paper_id: str,
    expires_in: int = 60 * 60, 
    authorization: str = Header(...),
):
    """
    Return a fresh 1‑hour signed URL for a given paper so the client can view it.
    
    Args:
        paper_id: The ID of the paper to get the signed URL for.
        expires_in: The number of seconds for the signed URL to be valid.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the signed URL.
    """

    user_id = _get_user_id(authorization)

    # Fetch the paper + check ownership
    paper_resp = (
        supabase.table("papers").select("storage_path, user_id").eq("id", paper_id).single().execute()
    )
    paper = paper_resp.data
    if not paper or paper["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Paper not found or access denied")

    # Generate a signed URL
    signed_resp = supabase.storage.from_("papers").create_signed_url(
        paper["storage_path"], expires_in=expires_in
    )

    return {"signed_url": signed_resp["signedURL"]}

@router.put("/{paper_id}/annotations", status_code=200)
async def upload_annotations(
    paper_id: str,
    annotations: List[str] = Body(..., description="List of annotation strings"),
    authorization: str = Header(...),
):
    """
    Set the annotations array for a paper.

    Args:
        paper_id: The ID of the paper to annotate.
        annotations: A JSON array of text annotations.
        authorization: The Authorization header containing the Bearer JWT.

    Returns:
        A dict with status, paper_id, and the saved annotations.
    """

    # 1. Authenticate
    user_id = _get_user_id(authorization)

    # 2. Fetch paper and check ownership
    paper_resp = (
        supabase
        .table("papers")
        .select("user_id")
        .eq("id", paper_id)
        .single()
        .execute()
    )
    if not paper_resp.data or paper_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Paper not found or access denied")

    # 3. Update annotations
    update_resp = (
        supabase
        .table("papers")
        .update({"annotations": annotations})
        .eq("id", paper_id)
        .execute()
    )
    
    return {
        "status": "success",
        "paper_id": paper_id,
        "annotations": annotations,
    }