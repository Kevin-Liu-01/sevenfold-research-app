"""Manuscript review agent for LaTeX content analysis."""

from typing import Any, AsyncIterator, List

from .base import Message, TooledAgent


class ReviewAgent(TooledAgent):
    """
    Agent that reviews LaTeX manuscript content and provides feedback.

    This agent analyzes academic papers/manuscripts and provides
    structured feedback on writing quality, structure, citations, etc.

    Can use tools to:
    - Look up citation information
    - Check formatting guidelines
    - Analyze document structure
    - Compare against style guides
    """

    SYSTEM_PROMPT = """You are an expert academic manuscript reviewer. Your role is to provide
constructive, detailed feedback on LaTeX manuscripts for academic papers.

When reviewing, focus on:
1. **Structure**: Logical flow, section organization, argument progression
2. **Clarity**: Writing quality, technical accuracy, accessibility
3. **Citations**: Proper attribution, relevant references, citation format
4. **Methodology**: Sound approach, reproducibility, limitations acknowledged
5. **Presentation**: Figures, tables, equations formatting

Provide actionable suggestions for improvement. Be constructive and specific.
Use your available tools when you need to verify information or check standards."""

    def __init__(self, model: str = "gemini-1.5-flash"):
        """
        Initialize the TooledReviewAgent.

        Args:
            model: The model identifier to use for generation.
        """
        self._model = model
        self._tools: List[Any] = []

    @property
    def name(self) -> str:
        return "review"

    @property
    def description(self) -> str:
        return "Reviews LaTeX manuscripts and provides structured academic feedback."

    @property
    def tools(self) -> List[Any]:
        """Return LangChain tools available to this agent."""
        return self._tools

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def run(self, input: str, **kwargs) -> str:
        """Run a simple review without conversation context."""
        messages = [Message(role="user", content=input)]
        response = await self.chat(messages, **kwargs)
        return response.content

    async def stream(self, input: str, **kwargs) -> AsyncIterator[str]:
        """Stream a simple review without conversation context."""
        messages = [Message(role="user", content=input)]
        async for chunk in self.chat_stream(messages, **kwargs):
            yield chunk

    async def chat(self, messages: List[Message], **kwargs) -> Message:
        """
        Process a review conversation with tool support.

        Args:
            messages: The conversation history.
            **kwargs: Additional parameters.

        Returns:
            The assistant's response message.
        """
        # TODO: Implement with LangChain agent
        raise NotImplementedError("ReviewAgent.chat not yet implemented")

    async def chat_stream(
        self,
        messages: List[Message],
        **kwargs,
    ) -> AsyncIterator[str]:
        """
        Stream a review conversation with tool support.

        Args:
            messages: The conversation history.
            **kwargs: Additional parameters.

        Yields:
            Chunks of the response.
        """
        # TODO: Implement with LangChain agent
        raise NotImplementedError("ReviewAgent.chat_stream not yet implemented")
        yield  # Makes this a generator
