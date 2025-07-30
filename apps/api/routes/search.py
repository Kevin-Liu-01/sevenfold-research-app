from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

from db.supabase import supabase
from transformers import AutoTokenizer
from adapters import AutoAdapterModel
import torch
import numpy as np

router = APIRouter(prefix="/search", tags=["search"])

tokenizer = AutoTokenizer.from_pretrained("allenai/specter2_base")
model = AutoAdapterModel.from_pretrained("allenai/specter2_base")
model.load_adapter(
    "allenai/specter2_adhoc_query",
    source="hf",
    load_as="specter2_adhoc_query",
    set_active=True,
)
model.set_active_adapters("specter2_adhoc_query")
model.eval()

class SearchRequest(BaseModel):
    query: str
    match_count: int = 30

def embed_query(query: str) -> List[float]:
    with torch.no_grad():
        inputs = tokenizer(
            query,
            padding=True,
            truncation=True,
            return_tensors="pt",
            max_length=512,
        )
        outputs = model(**inputs)
        embedding = outputs.last_hidden_state[:, 0, :]
        return embedding.squeeze(0).tolist()

def get_project_context_similarity(
    project_id: str,
    candidate_paper_ids: List[str],
    user_id: str
) -> Dict:
    """
    Get similarity scores between project context and candidate papers.
    Returns scores that can be integrated with RRF for hybrid search.
    """
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

@router.post("/", response_model=List[dict])
async def hybrid_search(request: SearchRequest):
    """
    Perform hybrid search using query embeddings and lexical ranking.
    """
    embedding = embed_query(request.query)
    
    
    resp = supabase.rpc(
        "hybrid_search",
        {
            "query_text": request.query,
            "query_embedding": embedding,
            "match_count": request.match_count,
        },
    ).execute()

    return resp.data or []
