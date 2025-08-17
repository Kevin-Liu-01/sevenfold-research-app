from fastapi import APIRouter, Header, HTTPException, Body, Query
from pydantic import BaseModel
from typing import List, Optional, Literal
from utils.auth import get_user_id_from_token
from db.supabase import supabase

router = APIRouter(prefix="/compositions", tags=["compositions"])

# Pydantic models for request/response
class CompositionCreate(BaseModel):
    project_id: str
    type: Literal["latex", "markdown"]
    title: Optional[str] = None
    contents: Optional[str] = None

class CompositionUpdate(BaseModel):
    title: Optional[str] = None
    contents: Optional[str] = None
    type: Optional[Literal["latex", "markdown"]] = None

class CompositionResponse(BaseModel):
    id: str
    project_id: str
    type: str
    title: Optional[str]
    contents: Optional[str]

def _get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    return get_user_id_from_token(token)

# verify project and composition to eliminate unauthorized access
def _verify_project_access(project_id: str, user_id: str) -> None:
    """Ensure the project exists and belongs to this user."""
    proj = (
        supabase
        .table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

def _verify_composition_access(composition_id: str, user_id: str) -> dict:
    """Ensure the composition exists and the user has access via project ownership."""
    comp = (
        supabase
        .table("compositions")
        .select("*, projects!inner(owner_id)")
        .eq("id", composition_id)
        .eq("projects.owner_id", user_id)
        .single()
        .execute()
    )
    if not comp.data:
        raise HTTPException(status_code=404, detail="Composition not found or access denied")
    return comp.data

@router.post("/create", response_model=CompositionResponse, status_code=201)
async def create_composition(
    composition: CompositionCreate,
    authorization: str = Header(...)
):
    """Create a new composition in a project."""
    user_id = _get_user_id(authorization)
    _verify_project_access(composition.project_id, user_id)
    
    result = (
        supabase
        .table("compositions")
        .insert({
            "project_id": composition.project_id,
            "type": composition.type,
            "title": composition.title,
            "contents": composition.contents
        })
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create composition")
    
    return result.data[0]

@router.get("/project/{project_id}", response_model=List[CompositionResponse])
async def get_compositions(
    project_id: str,
    composition_type: Optional[Literal["latex", "markdown"]] = Query(None, description="Filter by composition type"),
    authorization: str = Header(...)
):
    """Get all compositions for a project, optionally filtered by type."""
    user_id = _get_user_id(authorization)
    _verify_project_access(project_id, user_id)
    
    query = (
        supabase
        .table("compositions")
        .select("*")
        .eq("project_id", project_id)
    )
    
    if composition_type:
        query = query.eq("type", composition_type)
    
    result = query.execute()
    return result.data or []

@router.get("/{composition_id}", response_model=CompositionResponse)
async def get_composition(
    composition_id: str,
    authorization: str = Header(...)
):
    """Get a specific composition by ID."""
    user_id = _get_user_id(authorization)
    composition = _verify_composition_access(composition_id, user_id)
    
    return {
        "id": composition["id"],
        "project_id": composition["project_id"],
        "type": composition["type"],
        "title": composition["title"],
        "contents": composition["contents"]
    }

@router.put("/{composition_id}", response_model=CompositionResponse)
async def update_composition(
    composition_id: str,
    updates: CompositionUpdate,
    authorization: str = Header(...)
):
    """Update a composition."""
    user_id = _get_user_id(authorization)
    _verify_composition_access(composition_id, user_id)
    
    # Build update dict with only provided fields
    update_data = {}
    if updates.title is not None:
        update_data["title"] = updates.title
    if updates.contents is not None:
        update_data["contents"] = updates.contents
    if updates.type is not None:
        update_data["type"] = updates.type
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = (
        supabase
        .table("compositions")
        .update(update_data)
        .eq("id", composition_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update composition")
    
    return result.data[0]

@router.delete("/remove/{composition_id}", status_code=204)
async def delete_composition(
    composition_id: str,
    authorization: str = Header(...)
):
    """Delete a composition."""
    user_id = _get_user_id(authorization)
    _verify_composition_access(composition_id, user_id)
    
    result = (
        supabase
        .table("compositions")
        .delete()
        .eq("id", composition_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to delete composition")
