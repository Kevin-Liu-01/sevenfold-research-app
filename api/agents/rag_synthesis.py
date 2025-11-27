"""RAG synthesis agent for project-scoped document retrieval and generation."""

import os
from typing import Any, AsyncIterator, List, Optional
from uuid import UUID

from openai import AsyncOpenAI

from .base import Message, TooledAgent
from db.vector_store_service import VectorStoreService


class RAGSynthesisAgent(TooledAgent):
    """
    Agent that performs RAG-based synthesis over indexed PDFs in a project.

    This agent retrieves relevant context from a project's document library
    and synthesizes responses based on the retrieved information using
    OpenAI's Assistants API with file_search tool.

    Can use tools to:
    - Search across project documents
    - Retrieve specific document sections
    - Cross-reference between papers
    - Extract and cite relevant passages
    """

    SYSTEM_PROMPT = """You are an expert research assistant with access to a library of academic documents.
Your role is to help users find and synthesize information from their project's document collection.

When answering questions:
1. **Search thoroughly**: Use your tools to find relevant passages across documents
2. **Cite sources**: Always indicate which documents your information comes from
3. **Synthesize**: Combine information from multiple sources when relevant
4. **Acknowledge limits**: Be clear when information isn't available in the documents
5. **Be precise**: Quote directly when accuracy is critical

You have access to the user's project documents. Use your search tools to find relevant information
before answering. If you can't find relevant information, say so clearly."""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        openai_api_key: Optional[str] = None,
        vector_store_service: Optional[VectorStoreService] = None,
    ):
        """
        Initialize the RAGSynthesisAgent.

        Args:
            model: The OpenAI model to use (gpt-4o, gpt-4o-mini, etc.).
            openai_api_key: OpenAI API key. If not provided, reads from env.
            vector_store_service: Service for vector store operations.
        """
        api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self._model = model
        self._client = AsyncOpenAI(api_key=api_key)
        self._vector_store_service = vector_store_service or VectorStoreService(
            openai_api_key=api_key
        )
        self._tools: List[Any] = []
        self._project_id: Optional[UUID] = None
        self._target_pdf_id: Optional[UUID] = None
        self._assistant_id: Optional[str] = None

    @property
    def name(self) -> str:
        return "rag_synthesis"

    @property
    def description(self) -> str:
        return "Synthesizes responses from project documents using RAG retrieval."

    @property
    def tools(self) -> List[Any]:
        """Return tools available to this agent (file_search is built-in)."""
        return self._tools

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    def set_context(
        self,
        project_id: UUID,
        target_pdf_id: Optional[UUID] = None,
    ) -> None:
        """
        Set the project context for RAG operations.

        Args:
            project_id: The project to operate within.
            target_pdf_id: Optional specific PDF to focus on.
        """
        self._project_id = project_id
        self._target_pdf_id = target_pdf_id

    async def _get_or_create_assistant(self, vector_store_id: str) -> str:
        """
        Get or create an OpenAI Assistant with file_search enabled.

        Args:
            vector_store_id: The vector store to attach.

        Returns:
            Assistant ID.
        """
        if self._assistant_id:
            return self._assistant_id

        # Create a new assistant with file_search tool
        assistant = await self._client.beta.assistants.create(
            name="RAG Synthesis Assistant",
            instructions=self.SYSTEM_PROMPT,
            model=self._model,
            tools=[{"type": "file_search"}],
            tool_resources={"file_search": {"vector_store_ids": [vector_store_id]}},
        )

        self._assistant_id = assistant.id
        return assistant.id

    async def run(self, input: str, **kwargs) -> str:
        """Run RAG synthesis without conversation context."""
        if "project_id" in kwargs:
            self.set_context(kwargs["project_id"], kwargs.get("target_pdf_id"))
        messages = [Message(role="user", content=input)]
        response = await self.chat(messages, **kwargs)
        return response.content

    async def stream(self, input: str, **kwargs) -> AsyncIterator[str]:
        """Stream RAG synthesis without conversation context."""
        if "project_id" in kwargs:
            self.set_context(kwargs["project_id"], kwargs.get("target_pdf_id"))
        messages = [Message(role="user", content=input)]
        async for chunk in self.chat_stream(messages, **kwargs):
            yield chunk

    async def chat(self, messages: List[Message], **kwargs) -> Message:
        """
        Process a RAG conversation with tool support.

        Args:
            messages: The conversation history.
            **kwargs: Additional parameters.

        Returns:
            The assistant's response message.
        """
        if not self._project_id:
            raise ValueError("Project context must be set before calling chat()")

        # Get the vector store for this project
        vector_store_id = await self._vector_store_service.get_vector_store_id(
            self._project_id
        )

        if not vector_store_id:
            # No vector store yet - no documents uploaded
            return Message(
                role="assistant",
                content="No documents have been uploaded to this project yet. Please upload documents to enable search.",
            )

        # Get or create assistant
        assistant_id = await self._get_or_create_assistant(vector_store_id)

        # Create a thread
        thread = await self._client.beta.threads.create()

        # Add messages to thread
        for msg in messages:
            await self._client.beta.threads.messages.create(
                thread_id=thread.id, role=msg.role, content=msg.content
            )

        # Run the assistant
        run = await self._client.beta.threads.runs.create_and_poll(
            thread_id=thread.id, assistant_id=assistant_id
        )

        # Get the response
        if run.status == "completed":
            thread_messages = await self._client.beta.threads.messages.list(
                thread_id=thread.id, order="desc", limit=1
            )
            if thread_messages.data:
                response_message = thread_messages.data[0]
                content = response_message.content[0].text.value
                return Message(role="assistant", content=content)

        # Handle errors
        return Message(
            role="assistant",
            content=f"Error processing request: {run.status}",
        )

    async def chat_stream(
        self,
        messages: List[Message],
        **kwargs,
    ) -> AsyncIterator[str]:
        """
        Stream a RAG conversation with tool support.

        Args:
            messages: The conversation history.
            **kwargs: Additional parameters.

        Yields:
            Chunks of the response.
        """
        if not self._project_id:
            raise ValueError("Project context must be set before calling chat_stream()")

        # Get the vector store for this project
        vector_store_id = await self._vector_store_service.get_vector_store_id(
            self._project_id
        )

        if not vector_store_id:
            yield "No documents have been uploaded to this project yet. Please upload documents to enable search."
            return

        # Get or create assistant
        assistant_id = await self._get_or_create_assistant(vector_store_id)

        # Create a thread
        thread = await self._client.beta.threads.create()

        # Add messages to thread
        for msg in messages:
            await self._client.beta.threads.messages.create(
                thread_id=thread.id, role=msg.role, content=msg.content
            )

        # Stream the assistant's response
        async with self._client.beta.threads.runs.stream(
            thread_id=thread.id,
            assistant_id=assistant_id,
        ) as stream:
            async for event in stream:
                # Handle text deltas
                if event.event == "thread.message.delta":
                    for content_part in event.data.delta.content:
                        if hasattr(content_part, "text") and hasattr(
                            content_part.text, "value"
                        ):
                            yield content_part.text.value
