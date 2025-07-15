from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from db.supabase import supabase
from transformers import AutoTokenizer
from adapters import AutoAdapterModel
import torch

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
