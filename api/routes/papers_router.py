from fastapi import APIRouter, UploadFile, Form, HTTPException, Header, Body
from typing import Literal, List
import uuid

from db.supabase import supabase
from utils.auth import get_user_id_from_token

import os
import re
import json
import uuid
from io import BytesIO
from typing import Literal

import requests
from fastapi import APIRouter, UploadFile, Form, Header, HTTPException
from PyPDF2 import PdfReader, PdfWriter

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
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not project_check.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

SYSTEM_INSTRUCTIONS = (
    "You are an expert PDF paper metadata extractor. "
    "Return STRICT JSON ONLY. No prose. No markdown. No backticks. "
    "If a field is unknown, return null (or [] for arrays). "
    "For 'authors', return an array of author names as strings in normal order. "
    "For 'category', return ONE broad, human-readable research category (e.g., "
    "Computer Science, Mathematics, Physics, Biology, Medicine, Engineering, Statistics, "
    "Economics & Finance, Psychology, Chemistry, Earth & Environmental Science, "
    "Materials Science, Linguistics, Education, Social Sciences, Philosophy, Law). "
    "Do not invent DOIs. If multiple candidate dates are present, prefer the publication date."
)

PROMPT_TEXT = (
    "From the attached PDF pages, extract a single JSON object with the following schema:\n"
    "{\n"
    '  "title": "TEXT NOT NULL",\n'
    '  "abstract": "TEXT or null",\n'
    '  "authors": ["TEXT", ...],\n'
    '  "year": INT or null,\n'
    '  "month": INT or null,\n'
    '  "day": INT or null,\n'
    '  "doi": "TEXT or null",\n'
    '  "category": "TEXT or null"\n'
    "}\n"
    "Rules:\n"
    "- Output MUST be valid JSON only (no comments/markdown).\n"
    "- 'authors' must be an array of strings (names).\n"
    "- If you cannot find a field, use null (or [] for authors).\n"
    "- 'category' should be a broad, human-readable discipline (e.g., Computer Science).\n"
    "- If a date is present, split into year, month, day integers (use null if missing)."
)

@router.post("/process-pdf")
async def process_pdf(
    file: UploadFile,
    project_id: str = Form(...),
    pages_spec: str = Form("1,2"),
    authorization: str = Header(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Pull API key from env at runtime
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Server missing ANTHROPIC_API_KEY")

    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)

    # Read and sanity-check PDF
    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF")

    # Build subset in-memory (1-based spec like '1,3-5')
    reader = PdfReader(BytesIO(pdf_bytes))
    total = len(reader.pages)
    indices = set()

    for part in pages_spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = [x.strip() for x in part.split("-", 1)]
            if not a.isdigit() or not b.isdigit():
                raise HTTPException(status_code=400, detail=f"Invalid page range: {part}")
            a, b = int(a), int(b)
            if a <= 0 or b <= 0 or b < a:
                raise HTTPException(status_code=400, detail=f"Invalid page range: {part}")
            for p in range(a, b + 1):
                if p - 1 >= total:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Page {p} out of range (document has {total} pages)",
                    )
                indices.add(p - 1)
        else:
            if not part.isdigit():
                raise HTTPException(status_code=400, detail=f"Invalid page: {part}")
            p = int(part)
            if p <= 0 or p - 1 >= total:
                raise HTTPException(
                    status_code=400,
                    detail=f"Page {p} out of range (document has {total} pages)",
                )
            indices.add(p - 1)

    indices = sorted(indices)
    if not indices:
        raise HTTPException(status_code=400, detail="pages_spec resolved to zero pages")

    writer = PdfWriter()
    for idx in indices:
        writer.add_page(reader.pages[idx])

    buf = BytesIO()
    writer.write(buf)
    subset_bytes = buf.getvalue()

    # -------- Anthropic Files upload (inline static config) --------
    up = requests.post(
        "https://api.anthropic.com/v1/files",
        headers={
            "x-api-key": api_key,
            # Required API version header
            "anthropic-version": "2023-06-01",
            # Required (as of now) for Files API access
            "anthropic-beta": "files-api-2025-04-14",
        },
        files={"file": ("subset.pdf", subset_bytes, "application/pdf")},
        timeout=60,
    )
    if up.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic upload failed: {up.status_code} {up.text}",
        )

    file_id = up.json().get("id")
    if not file_id:
        raise HTTPException(status_code=502, detail="Anthropic upload returned no id")

    # -------- Anthropic message call (inline model/tokens/headers) --------
    msg = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "files-api-2025-04-14",
            "content-type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1500,
            "system": SYSTEM_INSTRUCTIONS,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "document", "source": {"type": "file", "file_id": file_id}},
                        {"type": "text", "text": PROMPT_TEXT},
                    ],
                }
            ],
        },
        timeout=120,
    )
    if msg.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic message failed: {msg.status_code} {msg.text}",
        )

    # Parse JSON from reply
    blocks = msg.json().get("content", [])
    text = "".join((b.get("text", "") + "\n") for b in blocks if b.get("type") == "text").strip()

    metadata = None
    try:
        metadata = json.loads(text)
    except json.JSONDecodeError:
        # Try to salvage by extracting the first {...} block
        m = re.search(r"\{[\s\S]*\}", text)
        metadata = json.loads(m.group(0)) if m else None

    if not isinstance(metadata, dict):
        raise HTTPException(status_code=502, detail="Claude did not return valid JSON")

    # Enforce authors is an array
    if "authors" in metadata and not isinstance(metadata["authors"], list):
        metadata["authors"] = []

    # Check for existing papers in public corpus if we have a title
    existing_paper_info = {"has_existing_paper": False, "linked": False, "existing_paper": None}
    if metadata.get("title"):
        try:
            title = metadata["title"].strip()
            
            # Use the existing fuzzy_title_search function to find similar titles
            # This uses trigram similarity with unaccent normalization
            fuzzy_results = (
                supabase.rpc("fuzzy_title_search", {
                    "input_title": title,
                    "min_sim": 0.8,  # 80% similarity threshold
                    "limit_count": 5
                })
                .execute()
            )
            
            best_match = None
            
            if fuzzy_results.data:
                # Filter results to only include papers that are in the public corpus
                for paper in fuzzy_results.data:
                    # Check if this paper exists in publ_corpus
                    in_public_corpus = (
                        supabase.table("publ_corpus")
                        .select("paper_id")
                        .eq("paper_id", paper["id"])
                        .limit(1)
                        .execute()
                    )
                    
                    if in_public_corpus.data:
                        best_match = paper
                        print(f"Found fuzzy title match in public corpus: {best_match['title']}")
                        break
            
            if best_match:
                paper_id = best_match["id"]
                
                # Check if this paper is already linked to the project
                existing_link = (
                    supabase.table("project_paper_links")
                    .select("*")
                    .eq("project_id", project_id)
                    .eq("paper_id", paper_id)
                    .execute()
                )
                
                existing_paper_info["has_existing_paper"] = True
                existing_paper_info["existing_paper"] = best_match
                
                if not existing_link.data:
                    # Create the project-paper link
                    link_result = (
                        supabase.table("project_paper_links")
                        .insert({
                            "project_id": project_id,
                            "paper_id": paper_id,
                            "has_paper": True
                        })
                        .execute()
                    )
                    
                    if link_result.data:
                        existing_paper_info["linked"] = True
                        existing_paper_info["message"] = "Paper linked to project"
                else:
                    existing_paper_info["linked"] = True  # Already linked, still skip metadata
                    existing_paper_info["message"] = "Paper already linked to project"
                    
        except Exception as e:
            # Log error but don't fail the entire request
            print(f"Error checking for existing papers: {str(e)}")

    # NOTE: no storage + no signed URL here
    return {
        "status": "ok",
        "metadata": metadata,
        "existing_paper_info": existing_paper_info,
    }


# ===============
# 2) /upload-pdf
# ===============
@router.post("/upload-pdf", status_code=201)
async def upload_pdf(
    file: UploadFile,
    project_id: str = Form(...),
    paper_type: Literal["source", "candidate"] = Form(...),  # accepted for UX; schema doesn't store it
    metadata_json: str = Form(...),
    authorization: str = Header(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)

    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF")

    md = json.loads(metadata_json)
    title = (md.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="metadata.title is required")

    # store final file -> <user>/<project>/<uuid>.pdf
    final_path = f"{user_id}/{project_id}/{uuid.uuid4()}.pdf"
    supabase.storage.from_("papers").upload(
        path=final_path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )

    # write paper_attrs
    ins = (
        supabase.table("paper_attrs")
        .insert(
            {
                "title": title,
                "abstract": md.get("abstract"),
                "authors": md.get("authors") or [],
                "year": md.get("year"),
                "month": md.get("month"),
                "day": md.get("day"),
                "doi": md.get("doi"),
                "category": md.get("category"),
            }
        )
        .execute()
    )
    paper_id = ins.data[0]["id"]

    # link uploader-scoped priv_corpus row (embedding left NULL)
    supabase.table("priv_corpus").insert({"paper_id": paper_id, "user_id": user_id}).execute()

    # link paper to project
    supabase.table("project_paper_links").insert({
        "project_id": project_id, 
        "paper_id": paper_id,
        "has_paper": True,
        "pdf_uri": final_path
    }).execute()

    # generate preview signed URL **here** (1 day)
    preview_url = supabase.storage.from_("papers").create_signed_url(
        final_path, expires_in=60 * 60 * 24
    )["signedURL"]

    return {
        "status": "success",
        "paper_id": paper_id,
        "preview_url": preview_url,
    }

@router.get("/{paper_id}/signed-url")
def get_signed_url(
    paper_id: str,
    expires_in: int = 60 * 60, 
    authorization: str = Header(...),
):
    """
    Return a fresh 1‑hour signed URL for a given paper so the client can view it.
    Automatically detects whether the paper is in the 'papers' or 'library' bucket
    based on the pdf_uri field.
    
    Args:
        paper_id: The ID of the paper to get the signed URL for.
        expires_in: The number of seconds for the signed URL to be valid.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the signed URL.
    """

    user_id = _get_user_id(authorization)
    
    # Fetch the paper's PDF URI
    paper_resp = (
        supabase.table("paper_attrs")
        .select("pdf_uri")
        .eq("id", paper_id)
        .single()
        .execute()
    )
    
    if not paper_resp.data or not paper_resp.data.get("pdf_uri"):
        raise HTTPException(status_code=404, detail="Paper PDF not found")

    paper = paper_resp.data
    pdf_uri = paper["pdf_uri"]
    
    # Check if this is a library paper or user paper based on pdf_uri
    if pdf_uri.startswith("library/"):
        # Library paper - accessible to all authenticated users
        file_path = pdf_uri.replace("library/", "", 1)  # Remove "library/" prefix
        bucket_name = "library"
        storage_path = file_path
    else:
        # User paper - check access through priv_corpus
        try:
            access_check = (
                supabase.table("priv_corpus")
                .select("paper_id")
                .eq("paper_id", paper_id)
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            
            if not access_check.data:
                raise HTTPException(status_code=404, detail="Paper not found or access denied")
        except Exception as e:
            # Handle both "no rows returned" and other database errors
            if "0 rows" in str(e) or "no rows returned" in str(e).lower():
                raise HTTPException(status_code=404, detail="Paper not found or access denied")
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        bucket_name = "papers"
        storage_path = pdf_uri

    # Generate a signed URL from the appropriate bucket
    try:
        signed_resp = supabase.storage.from_(bucket_name).create_signed_url(
            storage_path, expires_in=expires_in
        )
        return {"signed_url": signed_resp["signedURL"]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {exc}")

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

