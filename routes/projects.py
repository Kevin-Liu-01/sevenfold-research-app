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

@router.get("/{project_id}/context-similarity")
def get_project_context_similarity(
    project_id: str,
    candidate_paper_ids: List[str] = Query(..., description="List of paper IDs to rank by project context"),
    authorization: str = Header(...),
):
    """
    Get similarity scores between project context and candidate papers.
    Returns scores that can be integrated with RRF for hybrid search.
    """

    user_id = _get_user_id(authorization)
    _verify_project(project_id, user_id)
    
    papers_response = (
        supabase
        .table("project_papers")
        .select("paper_id")
        .eq("project_id", project_id)
        .execute()
    )
    
    if not papers_response.data:
        raise HTTPException(status_code=404, detail="No papers found in project")
    
    project_paper_ids = [p["paper_id"] for p in papers_response.data]
    
    project_embeddings_response = (
        supabase
        .table("paper_embeddings")
        .select("paper_id, embedding")
        .in_("paper_id", project_paper_ids)
        .execute()
    )
    
    if not project_embeddings_response.data:
        raise HTTPException(status_code=404, detail="No embeddings found for project papers")
    
    embeddings = []
    for emb_data in project_embeddings_response.data:
        if emb_data.get("embedding"):
            # Supabase returns embeddings as lists
            embeddings.append(np.array(emb_data["embedding"]))
    
    if not embeddings:
        raise HTTPException(status_code=404, detail="No valid embeddings found for project papers")
    
    project_embedding = np.mean(embeddings, axis=0)
    project_embedding = project_embedding / np.linalg.norm(project_embedding)
    
    candidate_embeddings_response = (
        supabase
        .table("paper_embeddings")
        .select("paper_id, embedding")
        .in_("paper_id", candidate_paper_ids)
        .execute()
    )
    
    similarity_scores = {}
    for candidate in candidate_embeddings_response.data:
        if candidate.get("embedding"):
            candidate_vec = np.array(candidate["embedding"])
            # We already normalize in SPECTER2 embedding implementation
            similarity = float(np.dot(project_embedding, candidate_vec))
            similarity_scores[candidate["paper_id"]] = similarity
    
    # Add zero scores for papers without embeddings
    for paper_id in candidate_paper_ids:
        if paper_id not in similarity_scores:
            similarity_scores[paper_id] = 0.0
    
    # Convert to ranked list for RRF integration
    ranked_papers = sorted(similarity_scores.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "project_id": project_id,
        "method": "project_context",
        "scores": similarity_scores,
        "ranked_papers": [{"paper_id": pid, "score": score, "rank": idx + 1} 
                        for idx, (pid, score) in enumerate(ranked_papers)]
    }