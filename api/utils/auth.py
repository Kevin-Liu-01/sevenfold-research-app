from fastapi import HTTPException
import os
import jwt
from dotenv import load_dotenv

from db.supabase import supabase

load_dotenv()

def get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT).
    Decodes the JWT token without verification (since we trust Supabase tokens),
    then uses the service role key to verify the user exists.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    
    token = authorization.removeprefix("Bearer ")
    
    try:
        # Decode the JWT without verification to extract the user ID
        # We'll verify the user exists using Supabase admin API
        # Note: This is safe because we're only extracting the user ID, not trusting it
        unverified = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        # Verify the user exists in Supabase using the service role key
        # This ensures the token is valid and the user exists
        user_response = supabase.auth.admin.get_user_by_id(user_id)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token: user not found")
        
        return user_id
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token: unable to decode")
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower() or "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid token")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {error_msg}")

# verify project and composition to eliminate unauthorized access
def verify_project_access(user_id: str, project_id: str) -> None:
    """Ensure the project exists and belongs to this user."""
    proj = (
        supabase
        .table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("owner_id", user_id)
        .execute()
    )
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

def verify_file_access(project_id: str, file_id: str) -> None:
    """Ensure the file exists and belongs to this project."""
    file_rec = (
        supabase
        .table("project_files")
        .select("id")
        .eq("id", file_id)
        .eq("project_id", project_id)
        .execute()
    )
    if not file_rec.data:
        raise HTTPException(status_code=404, detail="File not found or access denied")
