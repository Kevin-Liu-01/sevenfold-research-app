"""
LangChain tools for the writing agent.
All tools that can be called by the agent in "agent" mode.
"""

from typing import List
from langchain_core.tools import tool
from db.supabase import supabase
from utils.composition_agent.chunking import embed_text


def get_writing_agent_tools(composition_id: str, user_id: str, project_id: str):
    """
    Get all available tools for the writing agent.
    Tools are configured with the current composition and user context.
    
    Args:
        composition_id: ID of the composition being edited
        user_id: ID of the current user
        project_id: ID of the project (for scoped searches)
    
    Returns:
        List of LangChain tools
    """
    
    # Define propose_edits tool with closure over composition_id and user_id
    @tool
    def propose_edits(
        section_name: str,
        operations: List[dict],
        rationale: str
    ) -> dict:
        """
        Propose edits to the composition - USE SPARINGLY, only when explicitly requested.
        
        This tool creates formal edit proposals that the user must review and accept.
        Only use this when the user specifically asks you to make changes, edit something,
        or fix issues. For general advice, questions, or suggestions, respond conversationally
        without using this tool.
        
        Args:
            section_name: Name/description of the section being edited (e.g., "Introduction", "Methods", "Lines 5-10")
            operations: List of edit operations, each with:
                - type: "insert", "delete", or "replace"
                - start_line: Starting line number (1-based)
                - end_line: Ending line number (1-based)
                - old_text: Text to be removed (for delete/replace)
                - new_text: Text to be added (for insert/replace)
            rationale: Explanation of why these edits improve the composition
        
        Returns:
            Success confirmation
        
        Example (only when user explicitly asks for edits):
            propose_edits(
                section_name="Introduction paragraph 1",
                operations=[{
                    "type": "replace",
                    "start_line": 5,
                    "end_line": 7,
                    "old_text": "The old unclear text...",
                    "new_text": "The improved, clearer text..."
                }],
                rationale="This change improves clarity by removing jargon and using active voice."
            )
        """
        # Return success - the frontend will handle displaying the proposal
        # The actual composition_id and user_id are captured in the closure
        return {
            "success": True,
            "message": f"Edit proposal created for '{section_name}'",
            "composition_id": composition_id,
            "user_id": user_id
        }
    
    # Define search_compositions tool with closure over project_id
    @tool
    def search_compositions(query: str, limit: int = 5) -> str:
        """
        Search for relevant content across all compositions in the current project.
        
        Use this to find existing content, avoid repetition, or reference related sections.
        Uses hybrid search combining semantic similarity and keyword matching for best results.
        
        Args:
            query: What to search for (e.g., "machine learning methodology", "related work on transformers")
            limit: Maximum number of results to return (default: 5, max: 10)
        
        Returns:
            Formatted string with relevant chunks including composition titles, line numbers, and content
        
        Example:
            search_compositions("methodology for data analysis", limit=3)
        """
        try:
            # Limit bounds
            limit = max(1, min(limit, 10))
            
            # Generate embedding for query
            query_embedding = embed_text(query)
            
            # Prepare query text for FTS (convert to tsquery format)
            query_words = query.strip().split()
            query_text = ' & '.join(query_words) if query_words else None
            
            # Search composition chunks in the current project using hybrid search
            result = supabase.rpc(
                'search_composition_chunks',
                {
                    'query_embedding': query_embedding,
                    'query_text': query_text,
                    'match_threshold': 0.3,
                    'match_count': limit,
                    'filter_project_id': project_id,
                    'semantic_weight': 0.7
                }
            ).execute()
            
            if not result.data or len(result.data) == 0:
                return f"No relevant content found for query: '{query}'"
            
            # Format results
            formatted_results = []
            for i, chunk in enumerate(result.data, 1):
                comp_title = chunk.get('composition_title', 'Untitled')
                lines = f"Lines {chunk['start_line']}-{chunk['end_line']}"
                similarity = chunk.get('similarity', 0)
                text = chunk['chunk_text']
                
                formatted_results.append(
                    f"{i}. [{comp_title}] {lines} (score: {similarity:.2f})\n{text}\n"
                )
            
            return "\n".join(formatted_results)
            
        except Exception as e:
            return f"Error searching compositions: {str(e)}"
    
    # Return list of all available tools
    return [propose_edits, search_compositions]
