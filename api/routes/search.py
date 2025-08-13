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

def get_project_context(project_id: str) -> List[float]:
    """
    Get the context vector of a project. This is done by averaging the embeddings
    of all papers stored in the project.
    """

    junction_resp = (
        supabase
        .table("project_paper_links")
        .select("paper_id")
        .eq("project_id", project_id)
        .execute()
    )

    project_paper_ids = [p["paper_id"] for p in junction_resp.data]

    publ_resp = (
        supabase
        .table("publ_corpus")
        .select("paper_id, embedding")
        .in_("paper_id", project_paper_ids)
        .execute()
    )

    publ_resp = (
        supabase
        .table("priv_corpus")
        .select("paper_id, embedding")
        .in_("paper_id", project_paper_ids)
        .execute()
    )

    embeddings = []
    for source in [publ_response.data, priv_response.data]:
        for row in source:
            if row.get("embedding"):
                embeddings.append(np.array(row["embedding"]))

    project_embedding = np.mean(embeddings, axis=0)
    project_embedding /= np.linalg.norm(project_embedding)
    return project_embedding

class SearchRequest(BaseModel):
    query: str
    # project_id: str
    match_count: int = 30
    lexical_weight: float = 1.0
    semantic_weight: float = 1.0
    context_weight: float = 1.0
    rrf_k: int = 50
    min_year: int = 2005

@router.post("/", response_model=List[dict])
async def hybrid_search(request: SearchRequest):
    """
    Perform hybrid search using query embeddings and lexical ranking.
    """
    query_embedding = embed_query(request.query)
    context_embedding = get_project_context(request.project_id)
    # context_embedding = np.zeros(768).tolist()

    resp = supabase.rpc(
        "hybrid_search",
        {
            "query_text": request.query,
            "query_embedding": query_embedding,
            "context_embedding": context_embedding,
            "match_count": request.match_count,
            "lexical_weight": request.lexical_weight,
            "semantic_weight": request.semantic_weight,
            "context_weight": request.context_weight,
            "rrf_k": request.rrf_k,
            "min_year": request.min_year
        },
    ).execute()

    print(resp)

    return resp.data or []
