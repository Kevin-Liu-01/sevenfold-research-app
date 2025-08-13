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

@router.post("/copy-from-library", status_code=201)
async def copy_paper_from_library(
    pdf_uri: str = Form(...),
    project_id: str = Form(...),
    paper_type: Literal["source", "candidate"] = Form(...),
    filename: str = Form(...),
    authorization: str = Header(...),
):
    """
    Copy a PDF from the library bucket to a user's project bucket.
    
    Args:
        pdf_uri: The library path of the PDF (e.g., "library/arXiv-1506.07671.pdf").
        project_id: The ID of the project to copy the paper to.
        paper_type: The type of paper to upload.
        filename: The filename to use for the copied paper.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the status, paper_id, and preview_url.
    """

    # 1. Authenticate & authorise
    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)

    try:
        # 2. Download the PDF from the library bucket
        # Remove "library/" prefix if present to get the file path
        library_path = pdf_uri.replace("library/", "") if pdf_uri.startswith("library/") else pdf_uri
        
        print(f"Original pdf_uri: {pdf_uri}")
        print(f"Processed library_path: {library_path}")
        
        # Download from library bucket
        try:
            # First, try to get a signed URL to verify the file exists
            try:
                signed_url_resp = supabase.storage.from_("library").create_signed_url(
                    library_path, expires_in=60  # 1 minute is enough for download
                )
                if not signed_url_resp or 'signedURL' not in signed_url_resp:
                    raise HTTPException(status_code=404, detail=f"Cannot access file in library: {library_path}")
                
                print(f"Successfully got signed URL for: {library_path}")
                
            except Exception as url_error:
                raise HTTPException(status_code=404, detail=f"File not found in library bucket: {library_path}. Error: {str(url_error)}")

            # Now try to download the file
            download_resp = supabase.storage.from_("library").download(library_path)
            if not download_resp:
                raise HTTPException(status_code=404, detail="PDF not found in library")
            
            # Debug: Check what type of response we got
            print(f"Download response type: {type(download_resp)}")
            
            # The Supabase Python client returns bytes directly
            if isinstance(download_resp, bytes):
                pdf_bytes = download_resp
            elif hasattr(download_resp, 'content'):
                # If it's a response object with content
                pdf_bytes = download_resp.content
            elif hasattr(download_resp, 'data'):
                # If it's wrapped in a data field
                pdf_bytes = download_resp.data
            else:
                # Try to convert to bytes
                pdf_bytes = bytes(download_resp) if download_resp else b''
                
            print(f"Converted to {len(pdf_bytes)} bytes")
            
            # Check if we got HTML (error page) instead of PDF
            if pdf_bytes.startswith(b'<html') or pdf_bytes.startswith(b'\n       <html'):
                raise HTTPException(status_code=404, detail=f"File not accessible in library bucket: {library_path}")
                
        except HTTPException:
            raise  # Re-raise HTTP exceptions as-is
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Failed to download from library: {str(e)}")

        # 3. Validate it's a PDF and check structure
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Downloaded file is empty")
        
        # Log some debugging info (first 10 bytes)
        print(f"Downloaded {len(pdf_bytes)} bytes, first 10 bytes: {pdf_bytes[:10]}")
        
        # Check PDF header
        if not pdf_bytes.startswith(b'%PDF'):
            # Also check if it's text that might be an error message
            try:
                text_content = pdf_bytes.decode('utf-8')[:100]
                raise HTTPException(status_code=400, detail=f"Downloaded file is not a valid PDF. Content starts with: {text_content}")
            except:
                raise HTTPException(status_code=400, detail=f"Downloaded file is not a valid PDF. First bytes: {pdf_bytes[:20]}")
        
        # Additional PDF validation - check for PDF trailer
        if b'%%EOF' not in pdf_bytes[-100:]:
            print("Warning: PDF may be incomplete - no EOF marker found at end")
        
        # Check minimum PDF size (should be at least a few KB)
        if len(pdf_bytes) < 1024:
            raise HTTPException(status_code=400, detail=f"PDF file seems too small ({len(pdf_bytes)} bytes)")
            
        print(f"PDF validation passed: {len(pdf_bytes)} bytes, starts with PDF header")

        # 4. Build a unique storage path -> <user>/<project>/<uuid>.pdf
        file_name = f"{uuid.uuid4()}.pdf"
        storage_path = f"{user_id}/{project_id}/{file_name}"

        # 5. Upload to user's papers bucket
        upload_resp = supabase.storage.from_("papers").upload(
            path=storage_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf"},
        )

        # 6. Immediate preview link (1 day)
        preview_resp = supabase.storage.from_("papers").create_signed_url(
            storage_path,
            expires_in=60 * 60 * 24,  # 1 day
        )

        # 7. Persist metadata
        insert_resp = supabase.table("papers").insert(
            {
                "project_id": project_id,
                "user_id": user_id,
                "storage_path": storage_path,
                "filename": filename,
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
        raise HTTPException(status_code=500, detail=f"Copy failed: {exc}")

@router.get("/library/{file_path:path}/signed-url")
def get_library_signed_url(
    file_path: str,
    expires_in: int = 60 * 60,
    authorization: str = Header(...),
):
    """
    Return a signed URL for a file in the library bucket.
    
    Args:
        file_path: The path to the file in the library bucket.
        expires_in: The number of seconds for the signed URL to be valid.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the signed URL.
    """

    # Authenticate user (library is accessible to all authenticated users)
    user_id = _get_user_id(authorization)

    try:
        # Generate a signed URL for the library file
        signed_resp = supabase.storage.from_("library").create_signed_url(
            file_path, expires_in=expires_in
        )

        return {"signed_url": signed_resp["signedURL"]}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {exc}")