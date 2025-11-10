import asyncio
import json
import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Literal

import anthropic
import httpx
from fastapi import APIRouter, Header, HTTPException, Query, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field
from utils.auth import get_user_id_from_token
from utils.latex_context import clean_context_window
from db.supabase import supabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from schema.db_types import CompositionCreate, CompositionUpdate, CompositionResponse

router = APIRouter(prefix="/compose", tags=["compose"])

PROMPTS_ROOT = Path(__file__).resolve().parent.parent / "prompts"

def _load_prompt(*relative_parts: str) -> str:
    return (PROMPTS_ROOT.joinpath(*relative_parts)).read_text(encoding="utf-8")

# LaTeX microservice URL - configurable via environment variable
LATEX_SERVICE_URL = os.getenv("LATEX_SERVICE_URL", "http://localhost:8081")

SSE_MEDIA_TYPE = "text/event-stream"
SSE_HEADERS = {
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
}

MAX_COMPLETION_TOKENS = 80
RATE_LIMIT_REFILL_PER_SEC = 2.0
RATE_LIMIT_BURST = 3
COMPLETION_MODEL = os.getenv("SEVENFOLD_AUTOCOMPLETE_MODEL", "claude-sonnet-4-20250514")
COMPLETION_TEMPERATURE = float(os.getenv("SEVENFOLD_AUTOCOMPLETE_TEMPERATURE", "0.25"))

anthropic_client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

COMPOSE_SYSTEM_PROMPT = _load_prompt("compose", "system_prompt.xml").strip()
COMPOSE_USER_PROMPT_TEMPLATE = _load_prompt("compose", "user_prompt_template.xml")

@dataclass
class TokenBucket:
    capacity: int
    refill_rate: float
    tokens: float = field(init=False)
    last_refill: float = field(default_factory=time.time)

    def __post_init__(self) -> None:
        self.tokens = self.capacity

    def consume(self, amount: float = 1.0) -> bool:
        self._refill()
        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False

    def _refill(self) -> None:
        now = time.time()
        elapsed = now - self.last_refill
        if elapsed <= 0:
            return
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now


@dataclass
class CompletionSession:
    user_id: str
    doc_id: str
    request_id: str
    started_at: float = field(default_factory=time.time)
    aborted: asyncio.Event = field(default_factory=asyncio.Event)
    first_token_time: Optional[float] = None

    def cancel(self) -> None:
        self.aborted.set()


ACTIVE_COMPLETIONS: Dict[str, Dict[str, CompletionSession]] = {}
USER_RATE_LIMITERS: Dict[str, TokenBucket] = {}


class CompletionRequest(BaseModel):
    doc_id: str = Field(..., description="Composition/document UUID")
    cursor: int = Field(..., ge=0, description="Cursor offset within the document")
    request_id: str = Field(..., description="Client-supplied request identifier")
    language: Literal["latex", "markdown", "docx"] = Field("latex", description="Document language")
    context: str = Field(..., min_length=1, description="Client-provided context window surrounding the cursor")


class AbortRequest(BaseModel):
    request_id: str = Field(..., description="Completion request identifier to abort")


def _format_sse(event_type: str, payload: Dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _get_rate_limiter(user_id: str) -> TokenBucket:
    limiter = USER_RATE_LIMITERS.get(user_id)
    if limiter is None:
        limiter = TokenBucket(capacity=RATE_LIMIT_BURST, refill_rate=RATE_LIMIT_REFILL_PER_SEC)
        USER_RATE_LIMITERS[user_id] = limiter
    return limiter


def _cancel_active_sessions_for_user(user_id: str) -> None:
    user_sessions = ACTIVE_COMPLETIONS.get(user_id)
    if not user_sessions:
        return
    for request_id, session in list(user_sessions.items()):
        session.cancel()
        user_sessions.pop(request_id, None)
    if not user_sessions:
        ACTIVE_COMPLETIONS.pop(user_id, None)


async def _rate_limited_stream(request_id: str):
    payload = {
        "request_id": request_id,
        "error": "rate_limited",
        "detail": "Too many completion requests per second.",
    }
    yield _format_sse("error", payload)


def _wrap_cdata(text: str) -> str:
    if not text:
        return "<![CDATA[]]>"
    safe_text = text.replace("]]>", "]]]]><![CDATA[>")
    return f"<![CDATA[{safe_text}]]>"


def _build_completion_prompt(context_excerpt: str) -> str:
    trimmed = context_excerpt.strip()
    context_cdata = _wrap_cdata(trimmed)
    recent_tokens = " ".join(trimmed.split()[-12:])
    recent_instruction = ""
    if recent_tokens:
        recent_instruction = f"    <item>Do not repeat these recent words: {_wrap_cdata(recent_tokens)}</item>"

    return COMPOSE_USER_PROMPT_TEMPLATE.format(
        context_cdata=context_cdata,
        recent_tokens_instruction=recent_instruction
    )

def _get_user_id(authorization: str) -> str:
    """Extract user ID from Authorization header (expects Bearer JWT)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.removeprefix("Bearer ")
    return get_user_id_from_token(token)

# verify project and composition to eliminate unauthorized access
def _verify_project_access(project_id: str, user_id: str) -> None:
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

def _verify_composition_access(composition_id: str, user_id: str) -> dict:
    """Ensure the composition exists and the user has access via project ownership."""
    comp = (
        supabase
        .table("compositions")
        .select("*, projects!inner(owner_id)")
        .eq("id", composition_id)
        .eq("projects.owner_id", user_id)
        .single()
        .execute()
    )
    if not comp.data:
        raise HTTPException(status_code=404, detail="Composition not found or access denied")
    return comp.data

@router.post("/new_composition", response_model=CompositionResponse, status_code=201)
async def create_composition(
    composition: CompositionCreate,
    authorization: str = Header(...)
):
    """Create a new composition in a project."""
    user_id = _get_user_id(authorization)
    _verify_project_access(composition.project_id, user_id)
    
    result = (
        supabase
        .table("compositions")
        .insert({
            "project_id": composition.project_id,
            "type": composition.type,
            "title": composition.title,
            "contents": composition.contents
        })
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create composition")
    
    return result.data[0]

@router.get("/project/{project_id}", response_model=List[CompositionResponse])
async def get_compositions(
    project_id: str,
    composition_type: Optional[Literal["docx", "latex", "markdown"]] = Query(None, description="Filter by composition type"),
    authorization: str = Header(...)
):
    """Get all compositions for a project, optionally filtered by type."""
    user_id = _get_user_id(authorization)
    _verify_project_access(project_id, user_id)
    
    query = (
        supabase
        .table("compositions")
        .select("*")
        .eq("project_id", project_id)
    )
    
    if composition_type:
        query = query.eq("type", composition_type)
    
    result = query.execute()
    return result.data or []

@router.get("/{composition_id}", response_model=CompositionResponse)
async def get_composition(
    composition_id: str,
    authorization: str = Header(...)
):
    """Get a specific composition by ID."""
    user_id = _get_user_id(authorization)
    composition = _verify_composition_access(composition_id, user_id)
    
    return {
        "id": composition["id"],
        "project_id": composition["project_id"],
        "type": composition["type"],
        "title": composition["title"],
        "contents": composition["contents"]
    }

@router.put("/update/{composition_id}", response_model=CompositionResponse)
async def update_composition(
    composition_id: str,
    updates: CompositionUpdate,
    authorization: str = Header(...)
):
    """Update a composition."""
    user_id = _get_user_id(authorization)
    _verify_composition_access(composition_id, user_id)
    
    # Build update dict with only provided fields
    update_data = {}
    if updates.title is not None:
        update_data["title"] = updates.title
    if updates.contents is not None:
        update_data["contents"] = updates.contents
    if updates.type is not None:
        update_data["type"] = updates.type
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = (
        supabase
        .table("compositions")
        .update(update_data)
        .eq("id", composition_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update composition")
    
    return result.data[0]

@router.delete("/remove/{composition_id}", status_code=204)
async def delete_composition(
    composition_id: str,
    authorization: str = Header(...)
):
    """Delete a composition."""
    user_id = _get_user_id(authorization)
    _verify_composition_access(composition_id, user_id)
    
    result = (
        supabase
        .table("compositions")
        .delete()
        .eq("id", composition_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to delete composition")


@router.post("/compile-latex/{composition_id}")
async def compile_latex(
    composition_id: str,
    authorization: str = Header(...)
):
    """
    Compile a LaTeX composition to PDF using the LaTeX microservice.
    
    Returns the compiled PDF file directly or an error message.
    """
    user_id = _get_user_id(authorization)
    composition = _verify_composition_access(composition_id, user_id)
    
    # Verify it's a LaTeX composition
    if composition["type"] != "latex":
        raise HTTPException(
            status_code=400, 
            detail=f"Composition type is '{composition['type']}', not 'latex'"
        )
    
    # Get the LaTeX content
    tex_content = composition.get("contents")
    if not tex_content:
        raise HTTPException(
            status_code=400,
            detail="Composition has no content to compile"
        )
    
    # Call LaTeX microservice to compile
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{LATEX_SERVICE_URL}/compile",
                json={
                    "tex_content": tex_content,
                    "assets": None,  # TODO: In future, support file uploads for assets
                    "timeout": 45
                }
            )
            
            if response.status_code == 200:
                # Return PDF directly
                title = composition.get("title") or "composition"
                # Sanitize filename
                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
                if not safe_title:
                    safe_title = "composition"
                
                return Response(
                    content=response.content,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f'inline; filename="{safe_title}.pdf"'
                    }
                )
            else:
                # Extract error message from microservice
                error_detail = response.json().get("detail", "LaTeX compilation failed")
                raise HTTPException(status_code=400, detail=error_detail)
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="LaTeX compilation timed out. Document may be too complex."
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"LaTeX service unavailable: {str(e)}"
        )


@router.post("/complete")
async def stream_completion(
    completion_request: CompletionRequest,
    request: Request,
    authorization: str = Header(...)
):
    """Stream ghost-text completion suggestions for a composition."""
    user_id = _get_user_id(authorization)
    limiter = _get_rate_limiter(user_id)
    if not limiter.consume():
        return StreamingResponse(
            _rate_limited_stream(completion_request.request_id),
            media_type=SSE_MEDIA_TYPE,
            headers=SSE_HEADERS
        )

    context_meta = clean_context_window(completion_request.context)
    context_excerpt = context_meta["excerpt"]
    if not context_excerpt:
        async def _no_context_stream():
            payload = {
                "request_id": completion_request.request_id,
                "error": "no_context",
                "detail": "No context available for completion.",
            }
            yield _format_sse("error", payload)

        return StreamingResponse(
            _no_context_stream(),
            media_type=SSE_MEDIA_TYPE,
            headers=SSE_HEADERS
        )

    _cancel_active_sessions_for_user(user_id)

    session = CompletionSession(
        user_id=user_id,
        doc_id=completion_request.doc_id,
        request_id=completion_request.request_id,
    )
    ACTIVE_COMPLETIONS.setdefault(user_id, {})[completion_request.request_id] = session

    prompt_payload = _build_completion_prompt(context_excerpt)
    anthropic_messages = [{"role": "user", "content": prompt_payload}]

    async def event_publisher():
        usage_summary = {"input_tokens": 0, "output_tokens": 0}
        try:
            if await request.is_disconnected():
                session.cancel()
                return

            try:
                with anthropic_client.messages.stream(
                    model=COMPLETION_MODEL,
                    system=COMPOSE_SYSTEM_PROMPT,
                    messages=anthropic_messages,
                    max_tokens=MAX_COMPLETION_TOKENS,
                    temperature=COMPLETION_TEMPERATURE,
                ) as stream:
                    for text in stream.text_stream:
                        client_disconnected = await request.is_disconnected()
                        if session.aborted.is_set() or client_disconnected:
                            session.cancel()
                            stream.close()
                            detail = "Client disconnected." if client_disconnected else "Completion cancelled."
                            error_payload = {
                                "request_id": completion_request.request_id,
                                "error": "aborted",
                                "detail": detail,
                            }
                            yield _format_sse("error", error_payload)
                            return

                        if not text:
                            continue

                        if session.first_token_time is None:
                            session.first_token_time = time.time()

                        chunk_payload = {
                            "request_id": completion_request.request_id,
                            "delta": text,
                            "finish": False,
                        }
                        yield _format_sse("chunk", chunk_payload)

                    final_message = stream.get_final_message()
                    if final_message and final_message.usage:
                        usage_summary = {
                            "input_tokens": final_message.usage.input_tokens,
                            "output_tokens": final_message.usage.output_tokens,
                        }
            except Exception as exc:
                error_payload = {
                    "request_id": completion_request.request_id,
                    "error": "generation_failed",
                    "detail": str(exc),
                }
                yield _format_sse("error", error_payload)
                return

            done_payload = {
                "request_id": completion_request.request_id,
                "finish": True,
                "usage": usage_summary,
            }
            yield _format_sse("done", done_payload)
        finally:
            user_sessions = ACTIVE_COMPLETIONS.get(user_id)
            if user_sessions:
                user_sessions.pop(completion_request.request_id, None)
                if not user_sessions:
                    ACTIVE_COMPLETIONS.pop(user_id, None)

    return StreamingResponse(
        event_publisher(),
        media_type=SSE_MEDIA_TYPE,
        headers=SSE_HEADERS
    )


@router.post("/complete/abort", status_code=202)
async def abort_completion(
    abort_request: AbortRequest,
    authorization: str = Header(...)
):
    """Abort an in-flight completion stream."""
    user_id = _get_user_id(authorization)
    session = ACTIVE_COMPLETIONS.get(user_id, {}).get(abort_request.request_id)
    if not session:
        return {"status": "not_found"}

    session.cancel()
    user_sessions = ACTIVE_COMPLETIONS.get(user_id)
    if user_sessions:
        user_sessions.pop(abort_request.request_id, None)
        if not user_sessions:
            ACTIVE_COMPLETIONS.pop(user_id, None)
    return {"status": "aborting"}
