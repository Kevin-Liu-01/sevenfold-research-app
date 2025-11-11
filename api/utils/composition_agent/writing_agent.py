"""
LangGraph-based writing agent with custom states and tool execution.
Provides better control and streaming for the UI.
"""

from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_anthropic import ChatAnthropic
import os


class AgentState(TypedDict):
    """State of the writing agent."""
    # Use add_messages to properly accumulate messages instead of replacing
    messages: Annotated[Sequence[BaseMessage], add_messages]
    

def create_writing_agent(composition_id: str, user_id: str, project_id: str):
    """
    Create a LangGraph-based writing agent.
    
    Args:
        composition_id: ID of the composition being edited
        user_id: ID of the current user
        project_id: ID of the project for scoped searches
        
    Returns:
        Compiled LangGraph agent
    """
    from utils.composition_agent.agent_tools import get_writing_agent_tools
    
    # Get tools configured for this context
    tools = get_writing_agent_tools(composition_id, user_id, project_id)
    
    # Initialize LLM
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        temperature=0.7,
        max_tokens=2000,
    )
    
    # Bind tools to LLM
    llm_with_tools = llm.bind_tools(tools)
    
    # Create tool node (don't wrap it - let it stream naturally)
    tool_node = ToolNode(tools)
    
    # Define agent node
    def agent_node(state: AgentState):
        """
        Main agent reasoning node.
        Decides what to do next: use tools or respond.
        """
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}
    
    # Define routing logic
    def should_continue(state: AgentState):
        """
        Decide whether to continue with tool execution or end.
        """
        last_message = state["messages"][-1]
        
        # If there are tool calls, execute them
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            return "tools"
        
        # Otherwise, we're done
        return "end"
    
    # Build the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    
    # After tools, always go back to agent
    workflow.add_edge("tools", "agent")
    
    # Compile the graph
    return workflow.compile()
