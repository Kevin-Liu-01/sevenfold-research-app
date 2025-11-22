from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel


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
    description="Runs a per-project RAG flow over indexed PDFs and streams Gemini responses.",
)
async def synthesis_agent(payload: SynthesisRequest):
    pass