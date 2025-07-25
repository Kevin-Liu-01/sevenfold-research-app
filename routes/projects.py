import numpy as np
from fastapi import APIRouter, Header, HTTPException, Body, Query
from utils.auth import get_user_id_from_token
from db.supabase import supabase
from typing import List

router = APIRouter(prefix="/projects", tags=["projects"])

def _get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    return get_user_id_from_token(token)

def _verify_project(project_id: str, user_id: str) -> None:
    """Ensure the project exists and belongs to this user."""
    proj = (
        supabase
        .table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

# potentially change to a centralized get for all project columns
@router.get("/{project_id}/get-editor-content", status_code=200)
def get_editor_content(
    project_id: str,
    authorization: str = Header(...),
):
    """
    Retrieve the editor_content field for a project.

    Args:
        project_id: UUID of the project.
        authorization: Bearer JWT authorization header.

    Returns:
        JSON with project_id and editor_content (may be null/empty).
    """
    # Authenticate user
    user_id = _get_user_id(authorization)

    # Authorize access
    _verify_project(project_id, user_id)

    # Fetch the editor_content
    resp = (
        supabase
        .table("projects")
        .select("editor_content")
        .eq("id", project_id)
        .single()
        .execute()
    )
    content = resp.data.get("editor_content") if resp.data else None

    return {
        "project_id": project_id,
        "editor_content": content,
    }

@router.put("/{project_id}/editor-content", status_code=200)
async def update_editor_content(
    project_id: str,
    editor_content: str = Body(..., embed=True),
    authorization: str = Header(...),
):
    # 1) Authenticate & authorize
    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)

    # 2) Overwrite the editor_content field
    supabase.table("projects") \
      .update({"editor_content": editor_content}) \
      .eq("id", project_id) \
      .execute()

    return {"project_id": project_id, "editor_content": editor_content}
