import os
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException

from api.db.supabase import supabase

load_dotenv()

def get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise ValueError("SUPABASE_JWT_SECRET is not set")
    return secret

def _get_user_id_from_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, 
            get_jwt_secret(), 
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload["sub"]
    except Exception as e:
        print("JWT decode error:", str(e)) 
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    return _get_user_id_from_token(token)

# verify project and composition to eliminate unauthorized access
def verify_project_access(user_id: str, project_id: str) -> None:
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

def verify_file_access(project_id: str, file_id: str) -> None:
    """Ensure the file exists and belongs to this project."""
    file_rec = (
        supabase
        .table("files")
        .select("id")
        .eq("id", file_id)
        .eq("project_id", project_id)
        .single()
        .execute()
    )
    if not file_rec.data:
        raise HTTPException(status_code=404, detail="File not found or access denied")
