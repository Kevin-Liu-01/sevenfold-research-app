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
