import os
import sys
from fastapi import APIRouter, Header, HTTPException, Body, Query
from fastapi.responses import Response, StreamingResponse
from typing import List, Optional, Literal
import httpx
import json
from dotenv import load_dotenv
from utils.auth import get_user_id_from_token
from db.supabase import supabase

# LangChain imports
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage

load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from schema.db_types import CompositionCreate, CompositionUpdate, CompositionResponse

router = APIRouter(prefix="/compose", tags=["compose"])

# LaTeX microservice URL - configurable via environment variable
LATEX_SERVICE_URL = os.getenv("LATEX_SERVICE_URL", "http://localhost:8081")

# Initialize LangChain ChatAnthropic
llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    temperature=0.7,
    max_tokens=2000,
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


# ============================================================================
# Writing Agent Chat Endpoint
# ============================================================================

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
    
    # Build system prompt based on mode
    if mode == "agent":
        system_prompt = f"""You are an agentic writing assistant for academic and technical writing.

You have access to the user's current composition:

**Title:** {composition.get('title', 'Untitled')}
**Type:** {composition.get('type', 'unknown')}

**Current Content:**
{composition.get('contents', 'No content yet')}

Your role is to:
- Answer questions and provide helpful advice about the writing
- Suggest improvements when specifically asked or when there are significant issues
- Use the `propose_edits` tool ONLY when the user explicitly requests edits or changes
- Help improve structure, flow, clarity, and academic rigor through discussion
- Assist with LaTeX/Markdown syntax when relevant

Guidelines:
- For general questions, provide advice and suggestions in your response
- Only use propose_edits when the user asks you to make specific changes
- Be conversational and helpful rather than automatically proposing formal edits
- Focus on teaching and explaining rather than just editing

Document type: {composition.get('type', 'unknown')}"""
    else:  # ask mode
        system_prompt = f"""You are a helpful writing assistant for academic and technical writing.

You have access to the user's current composition:

**Title:** {composition.get('title', 'Untitled')}
**Type:** {composition.get('type', 'unknown')}

**Current Content:**
{composition.get('contents', 'No content yet')}

Your role is to:
- Answer questions about the composition
- Provide writing suggestions and improvements
- Help with formatting, structure, and clarity
- Assist with LaTeX/Markdown syntax when relevant

Be concise, helpful, and focused on improving the user's writing.

When suggesting edits, be specific about what should change and why."""

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
                        
                        yield f"data: {json.dumps({
                            'type': 'tool_call',
                            'tool': tool_name,
                            'data': tool_input
                        })}\n\n"
                        
                    # Tool execution completed
                    elif kind == "on_tool_end":
                        tool_name = event.get("name", "unknown")
                        tool_output = event.get("data", {}).get("output")
                        
                        # Convert tool output to string if it's not already
                        if hasattr(tool_output, 'content'):
                            # It's a ToolMessage object
                            tool_result = tool_output.content
                        elif isinstance(tool_output, str):
                            tool_result = tool_output
                        else:
                            tool_result = str(tool_output)
                        
                        yield f"data: {json.dumps({
                            'type': 'tool_result',
                            'tool': tool_name,
                            'result': tool_result
                        })}\n\n"
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
