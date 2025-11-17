import asyncio
from dataclasses import dataclass, field
import json
import json
import logging
import os
from pathlib import Path
import sys
import time
from typing import Dict, List, Literal, Optional

# Add parent directory to path BEFORE importing schema
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import anthropic
from db.supabase import supabase
from dotenv import load_dotenv
from fastapi import APIRouter, Body, HTTPException, Header, Query, Request
from fastapi.responses import Response, StreamingResponse
import httpx
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from pydantic import BaseModel, Field
from schema.db_types import CompositionCreate, CompositionResponse, CompositionUpdate
from utils.auth import get_user_id_from_token
from utils.latex_context import clean_context_suffix, clean_context_window

load_dotenv()


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compose", tags=["compose"])

PROMPTS_ROOT = Path(__file__).resolve().parent.parent / "prompts"

def _load_prompt(*relative_parts: str) -> str:
    return (PROMPTS_ROOT.joinpath(*relative_parts)).read_text(encoding="utf-8")

# LaTeX microservice URL - configurable via environment variable
LATEX_SERVICE_URL = os.getenv("LATEX_SERVICE_URL", "http://localhost:8081")

# Initialize LangChain ChatAnthropic
llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    temperature=0.7,
    max_tokens=2000,
)

SSE_MEDIA_TYPE = "text/event-stream"
SSE_HEADERS = {
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
}

MAX_COMPLETION_TOKENS = 50
RATE_LIMIT_REFILL_PER_SEC = 2.0
RATE_LIMIT_BURST = 3
COMPLETION_MODEL = os.getenv("SEVENFOLD_AUTOCOMPLETE_MODEL", "claude-haiku-4-5-20251001")
COMPLETION_TEMPERATURE = float(os.getenv("SEVENFOLD_AUTOCOMPLETE_TEMPERATURE", "0.25"))

anthropic_client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

COMPOSE_SYSTEM_PROMPT = _load_prompt("compose", "completion_system_prompt.xml").strip()
COMPOSE_USER_PROMPT_TEMPLATE = _load_prompt("compose", "completion_user_prompt_template.xml")

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
ACTIVE_COMPLETIONS_LOCK = asyncio.Lock()
RATE_LIMITERS_LOCK = asyncio.Lock()


class CompletionRequest(BaseModel):
    doc_id: str = Field(..., description="Composition/document UUID")
    cursor: int = Field(..., ge=0, description="Cursor offset within the document")
    request_id: str = Field(..., description="Client-supplied request identifier")
    language: Literal["latex", "markdown", "docx"] = Field("latex", description="Document language")
    context_before: str = Field(..., description="Client-provided context window preceding the cursor")
    context_after: str = Field(..., description="Client-provided context window following the cursor")


class AbortRequest(BaseModel):
    request_id: str = Field(..., description="Completion request identifier to abort")


def _format_sse(event_type: str, payload: Dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _get_rate_limiter(user_id: str) -> TokenBucket:
    async with RATE_LIMITERS_LOCK:
        limiter = USER_RATE_LIMITERS.get(user_id)
        if limiter is None:
            limiter = TokenBucket(capacity=RATE_LIMIT_BURST, refill_rate=RATE_LIMIT_REFILL_PER_SEC)
            USER_RATE_LIMITERS[user_id] = limiter
        return limiter


async def _cancel_active_sessions_for_user(user_id: str) -> None:
    async with ACTIVE_COMPLETIONS_LOCK:
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


def _build_completion_prompt(context_before: str, context_after: str) -> str:
    before_trimmed = context_before.strip()
    after_trimmed = context_after.strip()
    context_before_cdata = _wrap_cdata(before_trimmed)
    context_after_cdata = _wrap_cdata(after_trimmed)
    recent_tokens = " ".join(before_trimmed.split()[-12:])
    recent_instruction = ""
    if recent_tokens.strip():
        recent_instruction = f"    <item>Do not repeat these recent words: {_wrap_cdata(recent_tokens)}</item>"

    return COMPOSE_USER_PROMPT_TEMPLATE.format(
        context_before=context_before_cdata,
        context_after=context_after_cdata,
        recent_tokens_instruction=recent_instruction,
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
    composition = _verify_composition_access(composition_id, user_id)
    
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
    
    # Update chunks if contents were changed
    if updates.contents is not None:
        from utils.composition_agent.chunking import update_composition_chunks
        # Run chunk update for this composition's project
        project_id = composition["project_id"]
        update_composition_chunks(project_id)
    
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

def _add_line_numbers(content: str) -> str:
    """Add line numbers to content for better context in prompts."""
    if not content:
        return "No content yet"
    
    lines = content.split('\n')
    numbered_lines = [f"{i+1:4d} | {line}" for i, line in enumerate(lines)]
    return '\n'.join(numbered_lines)

@router.post("/agent/chat")
async def writing_agent_chat(
    composition_id: str = Body(...),
    message: str = Body(...),
    conversation_history: Optional[List[dict]] = Body(None),
    mode: str = Body("ask"),  # 'ask' or 'agent'
    authorization: str = Header(...)
):
    """
    Streaming LLM endpoint for the writing agent.
    
    Modes:
    - 'ask': Conversational Q&A about the composition
    - 'agent': Agentic mode with tool calling for edit proposals
    
    This endpoint provides:
    - Conversational assistance with access to composition context
    - [Agent mode] Ability to propose structured edits using tools
    - Streaming responses for real-time feedback
    """
    user_id = _get_user_id(authorization)
    composition = _verify_composition_access(composition_id, user_id)
    
    # Prepare composition content with line numbers
    content_with_line_numbers = _add_line_numbers(composition.get('contents', ''))
    
    # Load appropriate prompt template
    if mode == "agent":
        prompt_template = _load_prompt("compose", "agent_system_prompt.xml")
    else:
        prompt_template = _load_prompt("compose", "ask_system_prompt.xml")
    
    # Format the system prompt with composition details
    system_prompt = prompt_template.format(
        title=composition.get('title', 'Untitled'),
        doc_type=composition.get('type', 'unknown'),
        content_with_line_numbers=content_with_line_numbers
    )

    # Build conversation messages
    messages = []
    
    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            if msg.get("role") in ["user", "assistant"]:
                messages.append({
                    "role": msg["role"],
                    "content": msg.get("content", "")
                })
    
    # Add current user message
    messages.append({
        "role": "user",
        "content": message
    })
    
    # Stream response from Claude via LangChain
    async def generate():
        try:
            # Build LangChain messages
            lc_messages = []
            
            # Add system message
            lc_messages.append(SystemMessage(content=system_prompt))
            
            # Add conversation history
            for msg in messages:
                if msg["role"] == "user":
                    lc_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    lc_messages.append(AIMessage(content=msg["content"]))
            
            assistant_content = ""
            
            # Bind tools if in agent mode
            if mode == "agent":
                from utils.composition_agent.writing_agent import create_writing_agent
                
                # Create LangGraph agent
                agent = create_writing_agent(composition_id, user_id, composition["project_id"])
                
                # Prepare initial state with system message and conversation history
                initial_messages = [SystemMessage(content=system_prompt)]
                
                # Add conversation history
                for msg in messages:
                    if msg["role"] == "user":
                        initial_messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        initial_messages.append(AIMessage(content=msg["content"]))
                
                # Stream agent execution
                async for event in agent.astream_events(
                    {"messages": initial_messages},
                    version="v2"
                ):
                    kind = event["event"]
                    
                    # Stream LLM tokens
                    if kind == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        if hasattr(chunk, 'content') and chunk.content:
                            content = chunk.content
                            if isinstance(content, str) and content:
                                assistant_content += content
                                yield f"data: {json.dumps({'type': 'content', 'text': content})}\n\n"
                            elif isinstance(content, list):
                                for block in content:
                                    if isinstance(block, dict) and block.get('type') == 'text':
                                        text = block.get('text', '')
                                        if text:
                                            assistant_content += text
                                            yield f"data: {json.dumps({'type': 'content', 'text': text})}\n\n"
                        
                    # Tool execution started
                    elif kind == "on_tool_start":
                        tool_name = event.get("name", "unknown")
                        tool_input = event.get("data", {}).get("input", {})
                        
                        yield f"""data: {json.dumps({
                            'type': 'tool_call',
                            'tool': tool_name,
                            'data': tool_input
                        })}\n\n"""

                    # Tool execution completed
                    elif kind == "on_tool_end":
                        tool_name = event.get("name", "unknown")
                        tool_output = event.get("data", {}).get("output")
                        
                        # Convert tool output to string if it's not already
                        if isinstance(tool_output, ToolMessage):
                            # It's a ToolMessage object
                            tool_result = tool_output.content
                        elif isinstance(tool_output, str):
                            tool_result = tool_output
                        else:
                            tool_result = str(tool_output)
                        
                        yield f"""data: {json.dumps({
                            'type': 'tool_result',
                            'tool': tool_name,
                            'result': tool_result
                        })}\n\n"""
            else:
                # Ask mode - no tools
                async for chunk in llm.astream(lc_messages):
                    # Get text content from chunk
                    if hasattr(chunk, 'content') and chunk.content:
                        text = chunk.content
                        assistant_content += text
                        yield f"data: {json.dumps({'type': 'content', 'text': text})}\n\n"
            
            # Send completion event
            final_data = {
                "type": "done",
                "composition_id": composition_id
            }
            yield f"data: {json.dumps(final_data)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Error generating response: {str(e)}'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/complete")
async def stream_completion(
    completion_request: CompletionRequest,
    request: Request,
    authorization: str = Header(...)
):
    """Stream ghost-text completion suggestions for a composition."""
    logger.info("compose completion requested")
    user_id = _get_user_id(authorization)
    limiter = await _get_rate_limiter(user_id)
    if not limiter.consume():
        logger.warning(
            "Compose completion rate limited",
            extra={
                "user_id": user_id,
                "doc_id": completion_request.doc_id,
                "request_id": completion_request.request_id,
            },
        )
        return StreamingResponse(
            _rate_limited_stream(completion_request.request_id),
            media_type=SSE_MEDIA_TYPE,
            headers=SSE_HEADERS
        )

    before_meta = clean_context_window(completion_request.context_before)
    after_meta = clean_context_suffix(completion_request.context_after)
    context_before_excerpt = before_meta["excerpt"]
    context_after_excerpt = after_meta["excerpt"]
    if not context_before_excerpt and not context_after_excerpt:
        logger.warning(
            "Compose completion missing context",
            extra={
                "user_id": user_id,
                "doc_id": completion_request.doc_id,
                "request_id": completion_request.request_id,
            },
        )
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

    await _cancel_active_sessions_for_user(user_id)

    session = CompletionSession(
        user_id=user_id,
        doc_id=completion_request.doc_id,
        request_id=completion_request.request_id,
    )
    async with ACTIVE_COMPLETIONS_LOCK:
        ACTIVE_COMPLETIONS.setdefault(user_id, {})[completion_request.request_id] = session

    prompt_payload = _build_completion_prompt(context_before_excerpt, context_after_excerpt)
    anthropic_messages = [{"role": "user", "content": prompt_payload}]

    async def event_publisher():
        usage_summary = {"input_tokens": 0, "output_tokens": 0}
        completion_text_parts: List[str] = []
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

                        completion_text_parts.append(text)
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
                logger.exception(
                    "Compose completion failed",
                    extra={
                        "user_id": user_id,
                        "doc_id": completion_request.doc_id,
                        "request_id": completion_request.request_id,
                    },
                )
                return

            done_payload = {
                "request_id": completion_request.request_id,
                "finish": True,
                "usage": usage_summary,
            }
            yield _format_sse("done", done_payload)
        finally:
            async with ACTIVE_COMPLETIONS_LOCK:
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
    async with ACTIVE_COMPLETIONS_LOCK:
        session = ACTIVE_COMPLETIONS.get(user_id, {}).get(abort_request.request_id)
    if not session:
        return {"status": "not_found"}

    session.cancel()
    async with ACTIVE_COMPLETIONS_LOCK:
        user_sessions = ACTIVE_COMPLETIONS.get(user_id)
        if user_sessions:
            user_sessions.pop(abort_request.request_id, None)
            if not user_sessions:
                ACTIVE_COMPLETIONS.pop(user_id, None)
    return {"status": "aborting"}
