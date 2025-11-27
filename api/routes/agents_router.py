from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.rag_synthesis import RAGSynthesisAgent
from db.vector_store_service import VectorStoreService
from utils.auth import get_user_id, verify_project_access


class SearchRequest(BaseModel):
    """Mock search agent payload for early UI exploration."""

    query: str


class ReviewRequest(BaseModel):
    """Request payload for the manuscript review agent."""

    latex_content: str


class SynthesisRequest(BaseModel):
    """Request payload for the RAG synthesis agent."""

    project_id: UUID
    query: str
    target_pdf_id: Optional[UUID] = None


router = APIRouter(prefix="/api/agents", tags=["Agents"])

# Initialize services once at module level
vector_store_service = VectorStoreService()
rag_agent = RAGSynthesisAgent(vector_store_service=vector_store_service)


@router.post(
    "/search",
    summary="Mock search agent",
    description="Optional helper endpoint returning placeholder search results for UI development.",
)
async def search_agent(payload: SearchRequest):
    pass


@router.post(
    "/review",
    summary="Manuscript review agent",
    description="Streams Gemini-powered review feedback for supplied LaTeX content.",
)
async def review_agent(payload: ReviewRequest):
    pass


@router.post(
    "/synthesis",
    summary="RAG synthesis agent",
    description="Runs a per-project RAG flow over indexed PDFs and streams OpenAI responses.",
)
async def synthesis_agent(
    payload: SynthesisRequest,
    authorization: str = Header(...),
):
    """
    Stream RAG synthesis responses for a project's documents.
    
    Args:
        payload: The synthesis request with project_id and query.
        authorization: Bearer token for authentication.
    
    Returns:
        Streaming text response with citations from project documents.
    """
    # Authenticate user
    user_id = get_user_id(authorization)
    
    # Verify user has access to this project
    verify_project_access(user_id, str(payload.project_id))
    
    # Set context for this request
    rag_agent.set_context(payload.project_id, payload.target_pdf_id)
    
    # Stream the response
    async def generate():
        try:
            async for chunk in rag_agent.stream(payload.query):
                yield chunk
        except Exception as e:
            yield f"\n\nError: {str(e)}"
    
    return StreamingResponse(generate(), media_type="text/plain")