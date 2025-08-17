from fastapi import APIRouter, HTTPException, Header, Body, File, UploadFile
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import anthropic
import os
import json
import base64

from db.supabase import supabase
from utils.auth import get_user_id_from_token

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize Anthropic client
client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Pydantic models
class ChatTabCreate(BaseModel):
    project_id: str

# NOT USED AS OF NOW SINCE PYDANTIC MODELS DO NOT SUPPORT FILE UPLOADS
class ChatRequest(BaseModel):
    tab_id: str
    message: str
    paper_id: Optional[str] = None
    include_similar_papers: bool = True
    max_similar_papers: int = 3

class ChatTabUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Helper functions
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

def _verify_tab_access(tab_id: str, user_id: str) -> Dict:
    """Verify user has access to the chatbot tab through their project."""
    result = (
        supabase
        .table("chatbot_tabs")
        .select("*, projects!inner(user_id)")
        .eq("id", tab_id)
        .single()
        .execute()
    )
    
    if not result.data or result.data["projects"]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this chat tab")
    
    return result.data

# Used for adding context for querying through paper similarity search but that is not being done now
# def _get_paper_details(paper_id: str) -> Optional[Dict[str, Any]]:
#     """Get paper details from the database."""
#     if not paper_id:
#         return None
        
#     result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    
#     if not result.data:
#         return None
    
#     paper_data = result.data
#     title = paper_data.get("filename", "Unknown Paper")
#     abstract = ""
    
#     if paper_data.get("annotations"):
#         try:
#             annotations = json.loads(paper_data["annotations"]) if isinstance(paper_data["annotations"], str) else paper_data["annotations"]
#             title = annotations.get("title", title)
#             abstract = annotations.get("abstract", "")
#         except:
#             pass
    
#     return {
#         "id": paper_id,
#         "title": title,
#         "abstract": abstract,
#         "type": paper_data.get("type"),
#         "metadata": paper_data
#     }

# Used for adding context for querying through paper similarity search but that is not being done now
# def _find_similar_papers(paper_id: str, limit: int = 3) -> List[Dict[str, Any]]:
#     """Find similar papers using embeddings."""
#     try:
#         result = supabase.rpc("match_documents", {
#             "query_paper_id": paper_id,
#             "match_count": limit
#         }).execute()
        
#         return result.data if result.data else []
#     except:
#         return []

def _build_chat_prompt(
    message: str,
    conversation_history: List[Dict],
    paper_context: Optional[Dict[str, Any]],
    similar_papers: Optional[List[Dict[str, Any]]] = None  # Add this parameter
) -> List[Dict[str, str]]:
    """Build the prompt for the LLM including all context."""
    
    system_content = """You are an AI research assistant helping users understand and work with scientific papers. 
You provide detailed, accurate, and helpful responses about papers, their content, methodologies, and how they can be integrated into research work.
Be concise but thorough, and always ground your responses in the actual paper content when available."""

    if paper_context:
        system_content += f"\n\nCurrent Paper Being Discussed:"
        system_content += f"\nTitle: {paper_context.get('title', 'Unknown')}"
        system_content += f"\nAbstract: {paper_context.get('abstract', 'No abstract available')}"
    
    # Add similar papers context
    if similar_papers:
        system_content += "\n\nRelated Papers for Additional Context:"
        for i, paper in enumerate(similar_papers[:3], 1):  # Limit to top 3
            system_content += f"\n{i}. {paper.get('title', 'Unknown')} - {paper.get('abstract', '')[:200]}..."
    
    messages = [{"role": "system", "content": system_content}]
    
    for msg in conversation_history:
        messages.append({
            "role": msg["role"],
            "content": msg["data"]
        })
    
    messages.append({
        "role": "user",
        "content": message
    })
    
    return messages

async def _generate_tab_name(user_message: str, paper_filenames: Optional[List[str]] = None) -> str:
    """Generate a concise tab name based on the first message."""
    try:
        prompt = f"Based on this user message, generate a very short (3-5 words) conversation title. Just return the title, nothing else.\n\nUser message: {user_message}"
        
        if paper_filenames:
            if len(paper_filenames) == 1:
                prompt += f"\n\nNote: The user uploaded a PDF: {paper_filenames[0]}"
            else:
                prompt += f"\n\nNote: The user uploaded {len(paper_filenames)} PDFs: {', '.join(paper_filenames[:3])}"
                if len(paper_filenames) > 3:
                    prompt += f" and {len(paper_filenames) - 3} more"
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514", # Best for balancing performance and cost
            system="You are a helpful assistant that generates concise conversation titles.",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.7
        )
        
        title = response.content[0].text.strip()

        # CAN DECIDE HOW TO IMPLEMENT LATER - Ensure title isn't too long
        # if len(title) > 50:
        #     title = title[:47] + "..."

        return title
    except:
        # Fallback to generic name if generation fails
        return "New Chat"


# API Endpoints

# @router.post("/tabs", status_code=201)
# async def create_chat_tab(
#     tab_data: ChatTabCreate,
#     authorization: str = Header(...),
# ):
#     """Create a new chat tab for a project."""
#     # Authenticate & authorize
#     user_id = _get_user_id(authorization)
#     _verify_project(tab_data.project_id, user_id)
    
#     # Create the tab with empty name
#     result = (
#         supabase
#         .table("chatbot_tabs")
#         .insert({
#             "project_id": tab_data.project_id,
#             "name": "", # Tabs now start without names and are given a name after the first message is sent
#         })
#         .execute()
#     )
    
#     if not result.data:
#         raise HTTPException(status_code=500, detail="Failed to create chat tab")
    
#     return result.data[0]

# @router.get("/tabs/project/{project_id}")
# async def get_project_tabs(
#     project_id: str,
#     authorization: str = Header(...),
# ):
#     """Get all chat tabs for a project."""
#     # Authenticate & authorize
#     user_id = _get_user_id(authorization)
#     _verify_project(project_id, user_id)
    
#     # Get tabs
#     result = (
#         supabase
#         .table("chatbot_tabs")
#         .select("*")
#         .eq("project_id", project_id)
#         .order("created_at", desc=True)
#         .execute()
#     )
    
#     return result.data if result.data else []

# # NOT BEING USED AS OF NOW
# # @router.get("/tabs/{tab_id}")
# # async def get_chat_tab(
# #     tab_id: str,
# #     authorization: str = Header(...),
# # ):
# #     """Get a specific chat tab."""
# #     # Authenticate & authorize
# #     user_id = _get_user_id(authorization)
# #     tab_data = _verify_tab_access(tab_id, user_id)
    
# #     return tab_data

# @router.get("/tabs/{tab_id}/messages")
# async def get_tab_messages(
#     tab_id: str,
#     authorization: str = Header(...),
# ):
#     """Get all messages for a specific chat tab."""
#     # Authenticate & authorize
#     user_id = _get_user_id(authorization)
#     _verify_tab_access(tab_id, user_id)
    
#     # Get messages
#     result = (
#         supabase
#         .table("chatbot_messages")
#         .select("*")
#         .eq("tab_id", tab_id)
#         .order("created_at", desc=False)
#         .execute()
#     )
    
#     return result.data if result.data else []

@router.post("/new_message", status_code=200)
async def send_chat_message(
    convo_id: str = Body(...),
    message: str = Body(...),
    paper_ids: Optional[List[str]] = Body(None),
    # FINDING SIMILAR PAPERS TO ADD TO CONTEXT NOT IMPLEMENTED YET
    # include_similar_papers: bool = Body(True),
    # max_similar_papers: int = Body(3),
    # authorization: str = Header(...), - NOT BEING DONE RIGHT NOW
):
    """Send a message to the chatbot with optional PDF upload."""
    # Authenticate & authorize - NOT BEING DONE RIGHT NOW
    # user_id = _get_user_id(authorization)
    # tab_data = _verify_tab_access(tab_id, user_id)
    
    # Fetch PDFs from storage if paper_ids provided
    pdf_contents = []
    paper_filenames = []
    
    if paper_ids:
        for paper_id in paper_ids:
            try:
                # Download PDF from Supabase storage
                # The file path in storage is just the paper_id (which is the filename)
                response = supabase.storage.from_("library").download(paper_id)
                
                if response:
                    pdf_contents.append({
                        "filename": paper_id,
                        "content": response
                    })
                    paper_filenames.append(paper_id)
                else:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Paper with ID {paper_id} not found in library"
                    )
            except Exception as e:
                if "404" in str(e):
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Paper with ID {paper_id} not found in library"
                    )
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Error fetching paper {paper_id}: {str(e)}"
                    )
    
    result = (
        supabase
        .table("chat_convos")
        .select("paper_ids")
        .eq("id", convo_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if paper_ids:
        existing_ids = set(result.data.get("paper_ids", []) or [])
        new_ids = set(paper_ids)
        ids_to_add = new_ids - existing_ids
        
        # Only update database if there are actually new IDs
        if ids_to_add:
            updated_paper_ids = list(existing_ids | ids_to_add)
            update_result = (
                supabase
                .table("chat_convos")
                .update({"paper_ids": updated_paper_ids})
                .eq("id", convo_id)
                .execute()
            )
            if not update_result.data:
                raise HTTPException(status_code=500, detail="Failed to update paper_ids")
    
    # # Get paper context if provided (and no PDF uploaded) - CAN GET PAPER CONTEXT WITH OR WITHOUT PDF UPLOAD SO CHANGE LATER
    # paper_context = None
    # if paper_id and not file:
    #     paper_context = _get_paper_details(paper_id)
    
    # # Get similar papers if requested (and no PDF uploaded) - CAN GET PAPER CONTEXT WITH OR WITHOUT PDF UPLOAD SO CHANGE LATER
    # similar_papers = []
    # if paper_id and include_similar_papers and not file:
    #     similar_papers = _find_similar_papers(paper_id, max_similar_papers)
    
    # Get conversation history
    history_result = (
        supabase
        .table("chat_messages")
        .select("*")
        .eq("convo_id", convo_id)
        .order("created_at", desc=False)
        .execute()
    )
    
    conversation_history = history_result.data if history_result.data else []

    result = (
        supabase
        .table("chat_convos")
        .select("*")
        .eq("id", convo_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message and tab needs a name
    is_first_message = len(conversation_history) == 0
    should_generate_name = is_first_message and (not result.data.get("name") or result.data["name"] == "")
    
    # Save user message with metadata - NOT BEING IMPLEMENTED RIGHT NOW
    # user_message_metadata = {"user_id": user_id}
    user_message_metadata = {}
    
    user_message_result = (
        supabase
        .table("chat_messages")
        .insert({
            "convo_id": convo_id,
            "role": "user",
            "data": message,
            "metadata": user_message_metadata
        })
        .execute()
    )
    
    if not user_message_result.data:
        raise HTTPException(status_code=500, detail="Failed to save message")
    
    # Build messages based on whether PDF is uploaded
    if pdf_contents:
        # PDF upload flow
        system_message = """You are an AI research assistant helping users understand and analyze PDF papers they upload. 
Provide detailed analysis based on the PDF content. Help the user understand the paper's contributions, methodology, findings, and how it could be integrated into their research."""
        
        if len(pdf_contents) > 1:
            system_message += f"\n\nThe user has uploaded {len(pdf_contents)} PDFs. Analyze them comprehensively and help identify relationships between them when relevant."
        
        claude_messages = []
        for msg in conversation_history:
            if msg["role"] != "system":
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["data"]
                })
        
        # Build user message with all PDFs
        user_content = []
        
        # Add all uploaded PDFs
        for pdf_data in pdf_contents:
            user_content.append({
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": base64.b64encode(pdf_data["content"]).decode('utf-8')
                },
                "cache_control": {"type": "ephemeral"}
            })
        
        # Add the text message
        user_content.append({
            "type": "text",
            "text": message
        })
        
        claude_messages.append({
            "role": "user",
            "content": user_content
        })
        
        # Increase max tokens for multiple PDFs
        max_tokens = 2000 if len(pdf_contents) > 1 else 1500
        
    else:
        # Regular chat flow (no PDFs)
        messages = _build_chat_prompt(
            message,
            conversation_history,
            None, # WILL NOT BE IMPLEMENTING PAPER_CONTEXT RIGHT NOW
            None # WILL NOT BE IMPLEMENTING SIMILAR_PAPERS RIGHT NOW
        )
        
        # Convert to Claude format
        system_message = ""
        claude_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"] # Accessing with keyword 'content' here is fine since _build_chat_prompt() creates new message dictionaries with the 'content' field
            else:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        max_tokens = 1000
    
    # Get response from Claude
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514", # Best for balancing performance and cost
            system=system_message,
            messages=claude_messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        assistant_content = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
    
    # Save assistant response
    assistant_metadata = {
        "model": "claude-sonnet-4-20250514", # Best for balancing performance and cost
        "tokens_used": tokens_used
    }
    if paper_ids:
        assistant_metadata["papers_referenced"] = paper_ids
    
    assistant_message_result = (
        supabase
        .table("chat_messages")
        .insert({
            "convo_id": convo_id,
            "role": "assistant",
            "data": assistant_content,
            "metadata": assistant_metadata
        })
        .execute()
    )
    
    if not assistant_message_result.data:
        raise HTTPException(status_code=500, detail="Failed to save assistant response")
    
    # Generate and update tab name if this is the first message
    tab_name_generated = None
    if should_generate_name:
        # Use paper filenames for name generation
        filenames_str = ", ".join(paper_filenames) if paper_filenames else None
        tab_name_generated = await _generate_tab_name(message, filenames_str)
        
        supabase.table("chat_convos") \
            .update({
                "name": tab_name_generated,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }) \
            .eq("id", convo_id) \
            .execute()
    else:
        # Just update timestamp
        supabase.table("chat_convos") \
            .update({"updated_at": datetime.now(timezone.utc).isoformat()}) \
            .eq("id", convo_id) \
            .execute()
    
    response_data = {
        "message": assistant_message_result.data[0],
        # "paper_context": paper_context, - NOT IMPLEMENTED YET
        # "similar_papers": similar_papers - NOT IMPLEMENTED YET
    }
    
    if paper_ids:
        response_data["papers_referenced"] = paper_ids

    if tab_name_generated:
        response_data["tab_name_generated"] = tab_name_generated
    
    return response_data

# @router.put("/tabs/{tab_id}", status_code=200)
# async def update_chat_tab(
#     tab_id: str,
#     update_data: ChatTabUpdate = Body(...),
#     authorization: str = Header(...),
# ):
#     """Update a chat tab's name or description."""
#     # Authenticate & authorize
#     user_id = _get_user_id(authorization)
#     _verify_tab_access(tab_id, user_id)
    
#     # Build update data
#     updates = {}
#     if update_data.name is not None:
#         updates["name"] = update_data.name
#     if update_data.description is not None:
#         updates["description"] = update_data.description
    
#     if not updates:
#         return {"message": "No updates provided"}
    
#     updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
#     # Update tab
#     result = supabase.table("chatbot_tabs") \
#         .update(updates) \
#         .eq("id", tab_id) \
#         .execute()
    
#     if not result.data:
#         raise HTTPException(status_code=500, detail="Failed to update tab")
    
#     return result.data[0]

# @router.delete("/tabs/{tab_id}", status_code=200)
# async def delete_chat_tab(
#     tab_id: str,
#     authorization: str = Header(...),
# ):
#     """Delete a chat tab and all its associated messages."""
#     # Authenticate & authorize
#     user_id = _get_user_id(authorization)
#     _verify_tab_access(tab_id, user_id)
    
#     # Hard delete - this will cascade delete all messages due to ON DELETE CASCADE
#     result = (
#         supabase
#         .table("chatbot_tabs")
#         .delete()
#         .eq("id", tab_id)
#         .execute()
#     )
    
#     if not result.data:
#         raise HTTPException(status_code=500, detail="Failed to delete tab")
    
#     return {"message": "Chat tab and all messages deleted successfully", "tab_id": tab_id}

# @router.delete("/messages/{message_id}", status_code=200)
# async def delete_message(
#     message_id: str,
#     authorization: str = Header(...),
# ):
#     """Delete a specific message from the conversation."""
#     # Authenticate
#     user_id = _get_user_id(authorization)
    
#     # Get the message first to find its tab_id
#     message_result = (
#         supabase
#         .table("chatbot_messages")
#         .select("id, tab_id")
#         .eq("id", message_id)
#         .single()
#         .execute()
#     )
    
#     if not message_result.data:
#         raise HTTPException(status_code=404, detail="Message not found")
    
#     tab_id = message_result.data["tab_id"]
    
#     # Verify user has access to this tab
#     _verify_tab_access(tab_id, user_id)
    
#     # Delete only this specific message
#     result = (
#         supabase
#         .table("chatbot_messages")
#         .delete()
#         .eq("id", message_id)
#         .execute()
#     )
    
#     if not result.data:
#         raise HTTPException(status_code=500, detail="Failed to delete message")
    
#     return {"message": "Message deleted successfully", "message_id": message_id}