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
from pathlib import Path

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
    

PROMPTS_ROOT = Path(__file__).resolve().parent.parent / "prompts"


def _load_prompt(*relative_parts: str) -> str:
    """Load a prompt text file from the prompts directory."""
    return (PROMPTS_ROOT.joinpath(*relative_parts)).read_text(encoding="utf-8")


SYSTEM_INSTRUCTIONS = _load_prompt("papers", "metadata_system_prompt.xml")
PROMPT_TEXT = _load_prompt("papers", "metadata_user_prompt.xml")

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
    existing_paper_info = {"has_existing_paper": False, "existing_paper": None}
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
                
                # Check if already linked and set message
                if existing_link.data:
                    existing_paper_info["message"] = "Paper already linked to project"
                else:
                    existing_paper_info["message"] = "Found existing paper, use link-paper endpoint to add to project"
                    
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

    # First create the paper_attrs record to get the paper ID
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

    # Use paper ID for file path instead of random UUID
    final_path = f"{user_id}/{project_id}/{paper_id}.pdf"
    
    # Upload the PDF with the paper ID as filename
    supabase.storage.from_("papers").upload(
        path=final_path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )

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
    project_id: str,
    expires_in: int = 60 * 60, 
    authorization: str = Header(...),
):
    """
    Return a fresh 1‑hour signed URL for a given paper so the client can view it.
    All papers are stored in the 'papers' bucket.
    
    Args:
        paper_id: The ID of the paper to get the signed URL for.
        project_id: The ID of the project containing the paper (required as query parameter).
        expires_in: The number of seconds for the signed URL to be valid.
        authorization: The authorization header containing the JWT token.

    Returns:
        A dictionary containing the signed URL.
    """

    user_id = _get_user_id(authorization)
    
    # Verify project access first
    _verify_project(project_id, user_id)
    
    # Fetch the paper's PDF URI using both paper_id and project_id
    paper_resp = (
        supabase.table("project_paper_links")
        .select("pdf_uri")
        .eq("paper_id", paper_id)
        .eq("project_id", project_id)
        .single()
        .execute()
    )
    
    if not paper_resp.data or not paper_resp.data.get("pdf_uri"):
        raise HTTPException(status_code=404, detail="Paper PDF not found in this project")

    paper = paper_resp.data
    pdf_uri = paper["pdf_uri"]

    # Generate a signed URL from the papers bucket
    try:
        signed_resp = supabase.storage.from_("papers").create_signed_url(
            pdf_uri, expires_in=expires_in
        )
        return {"signed_url": signed_resp["signedURL"]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {exc}")

@router.put("/{paper_id}/annotations", status_code=200)
async def upload_annotations(
    paper_id: str,
    project_id: str,
    annotations: List[str] = Body(..., description="List of annotation strings"),
    authorization: str = Header(...),
):
    """
    Set the annotations array for a paper in a specific project.

    Args:
        paper_id: The ID of the paper to annotate.
        project_id: The ID of the project containing the paper (required as query parameter).
        annotations: A JSON array of text annotations.
        authorization: The Authorization header containing the Bearer JWT.

    Returns:
        A dict with status, paper_id, and the saved annotations.
    """

    # 1. Authenticate
    user_id = _get_user_id(authorization)

    # 2. Verify project access
    _verify_project(project_id, user_id)

    # 3. Check if paper exists in this project
    paper_link = (
        supabase.table("project_paper_links")
        .select("paper_id")
        .eq("paper_id", paper_id)
        .eq("project_id", project_id)
        .single()
        .execute()
    )
    if not paper_link.data:
        raise HTTPException(status_code=404, detail="Paper not found in this project")

    # 4. Update annotations in the project_paper_links table
    update_resp = (
        supabase.table("project_paper_links")
        .update({"annotations": annotations})
        .eq("paper_id", paper_id)
        .eq("project_id", project_id)
        .execute()
    )
    
    return {
        "status": "success",
        "paper_id": paper_id,
        "project_id": project_id,
        "annotations": annotations,
    }

@router.post("/link-paper", status_code=201)
async def link_paper_to_project(
    file: UploadFile,
    paper_id: str = Form(...),
    project_id: str = Form(...),
    authorization: str = Header(...),
):
    """
    Link an existing paper from the public corpus to a project and upload the PDF.
    
    Args:
        paper_id: The ID of the existing paper to link.
        project_id: The ID of the project to link the paper to.
        file: The PDF file to upload for this paper.
        authorization: The authorization header containing the JWT token.
        
    Returns:
        A dictionary with the status, link information, and preview URL.
    """
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # 1. Authenticate and verify project ownership
    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)
    
    # 2. Verify the paper exists in the public corpus
    paper_in_corpus = (
        supabase.table("publ_corpus")
        .select("paper_id")
        .eq("paper_id", paper_id)
        .limit(1)
        .execute()
    )
    
    if not paper_in_corpus.data:
        raise HTTPException(status_code=404, detail="Paper not found in public corpus")
    
    # 3. Validate and read PDF
    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF")
    
    # 4. Check if already linked
    existing_link = (
        supabase.table("project_paper_links")
        .select("*")
        .eq("project_id", project_id)
        .eq("paper_id", paper_id)
        .execute()
    )
    
    if existing_link.data:
        return {
            "status": "already_linked",
            "message": "Paper is already linked to this project",
            "paper_id": paper_id,
            "project_id": project_id,
        }
    
    # 5. Upload PDF to storage
    final_path = f"{user_id}/{project_id}/{uuid.uuid4()}.pdf"
    supabase.storage.from_("papers").upload(
        path=final_path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )
    
    # 6. Create the project-paper link with PDF URI
    link_result = (
        supabase.table("project_paper_links")
        .insert({
            "project_id": project_id,
            "paper_id": paper_id,
            "has_paper": True,
            "pdf_uri": final_path
        })
        .execute()
    )
    
    if not link_result.data:
        raise HTTPException(status_code=500, detail="Failed to create project-paper link")
    
    # 8. Get paper details for response
    paper_details = (
        supabase.table("paper_attrs")
        .select("title, authors")
        .eq("id", paper_id)
        .single()
        .execute()
    )
    
    return {
        "status": "success",
        "message": "Paper successfully linked to project with PDF uploaded",
        "paper_id": paper_id,
        "project_id": project_id,
        "paper_title": paper_details.data.get("title") if paper_details.data else None
    }
