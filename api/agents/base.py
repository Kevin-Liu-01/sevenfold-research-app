"""Base agent interfaces for the Harbor AI system."""

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, List, Optional

from pydantic import BaseModel


class Message(BaseModel):
    """Represents a chat message in the conversation."""

    role: str  # "user", "assistant", "system"
    content: str


class Agent(ABC):
    """
    Base interface for all agents in the Harbor system.

    An Agent processes input and generates output, potentially in a streaming fashion.
    This is the minimal interface that all agents must implement.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the unique name/identifier of this agent."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Return a human-readable description of what this agent does."""
        ...

    @abstractmethod
    async def run(self, input: str, **kwargs) -> str:
        """
        Execute the agent with the given input and return the result.

        Args:
            input: The primary input/prompt for the agent.
            **kwargs: Additional context or parameters.

        Returns:
            The agent's response as a string.
        """
        ...

    @abstractmethod
    async def stream(self, input: str, **kwargs) -> AsyncIterator[str]:
        """
        Execute the agent with the given input and stream the result.

        Args:
            input: The primary input/prompt for the agent.
            **kwargs: Additional context or parameters.

        Yields:
            Chunks of the agent's response as they become available.
        """
        ...


class TooledAgent(Agent):
    """
    Extended agent interface with chat capabilities and tool use.

    A TooledAgent can:
    - Maintain conversation history
    - Use tools to perform actions or retrieve information
    - Execute multi-turn conversations with tool calls

    This interface is designed to be implemented using LangChain agents.
    Tools should be registered as LangChain tools.
    """

    @property
    @abstractmethod
    def tools(self) -> List[Any]:
        """Return the list of LangChain tools available to this agent."""
        ...

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt that defines the agent's behavior."""
        ...

    @abstractmethod
    async def chat(
        self,
        messages: List[Message],
        **kwargs,
    ) -> Message:
        """
        Process a conversation and return the next assistant message.

        This method handles tool calls internally, executing them and
        continuing the conversation until a final response is ready.

        Args:
            messages: The conversation history.
            **kwargs: Additional context or parameters.

        Returns:
            The assistant's response message.
        """
        ...

    @abstractmethod
    async def chat_stream(
        self,
        messages: List[Message],
        **kwargs,
    ) -> AsyncIterator[str]:
        """
        Process a conversation and stream the assistant's response.

        This method handles tool calls internally, executing them and
        continuing the conversation until a final response is ready.

        Args:
            messages: The conversation history.
            **kwargs: Additional context or parameters.

        Yields:
            Chunks of the assistant's response as they become available.
        """
        ...
