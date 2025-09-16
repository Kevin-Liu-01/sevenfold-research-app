from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

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

    priv_resp = (
        supabase
        .table("priv_corpus")
        .select("paper_id, embedding")
        .in_("paper_id", project_paper_ids)
        .execute()
    )

    embeddings = []
    for source in [publ_resp.data, priv_resp.data]:
        for row in source:
            emb = row.get("embedding")
            if emb:
                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except Exception:
                        continue

                arr = np.asarray(emb, dtype=np.float32).ravel()
                embeddings.append(arr)

    if not embeddings:
        return np.zeros(768).tolist()
    else:
        project_embedding = np.stack(embeddings, axis=0).mean(axis=0)
        return project_embedding.tolist()

class SearchRequest(BaseModel):
    query: str
    project_id: str
    match_count: int = 30
    lexical_weight: float = 1.0
    semantic_weight: float = 1.0
    context_weight: float = 1.0
    rrf_k: int = 50
    min_year: int = 2005
    fuzzy_title_first: bool = True
    fuzzy_min_sim: float = 0.7
    fuzzy_limit: int = 5
    
@router.post("/", response_model=List[dict])
async def hybrid_search(request: SearchRequest):
    """
    1) Run fuzzy title match using pg_trgm (pre-ranked, thresholded).
    2) Run the existing hybrid search.
    3) Return fuzzy matches first, followed by hybrid results (de-duplicated).
    """
    # 1) Fuzzy title search (returns SETOF paper_attrs)
    fuzzy_rows: List[Dict[str, Any]] = []
    fuzzy_ids: List[str] = []

    if request.fuzzy_title_first:
        fuzzy_resp = supabase.rpc(
            "fuzzy_title_search",
            {
                "input_title": request.query,
                "min_sim": request.fuzzy_min_sim,
                "limit_count": request.fuzzy_limit,
            },
        ).execute()

        fuzzy_rows = getattr(fuzzy_resp, "data", None) or []
        fuzzy_ids = [str(r.get("id")) for r in fuzzy_rows if r.get("id")]
        
    # 2) Hybrid search (returns SETOF paper_attrs)
    query_embedding = embed_query(request.query)
    context_embedding = get_project_context(request.project_id)

    hybrid_resp = supabase.rpc(
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
            "min_year": request.min_year,
        },
    ).execute()

    hybrid_rows = getattr(hybrid_resp, "data", None) or []

    # 3) Merge with de-dup (fuzzy on top). De-dupe by `id`.
    seen = set(fuzzy_ids)
    tail = [r for r in hybrid_rows if str(r.get("id")) not in seen]
    results = fuzzy_rows + tail

    return results
