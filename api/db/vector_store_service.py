"""OpenAI Vector Store Service for RAG functionality."""

import asyncio
import os
from typing import Optional
from uuid import UUID

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

from db.supabase import supabase

load_dotenv()


class VectorStoreService:
    """Manages OpenAI Vector Stores for project-scoped RAG."""

    def __init__(self, openai_api_key: Optional[str] = None):
        """
        Initialize the VectorStoreService.

        Args:
            openai_api_key: OpenAI API key. If not provided, reads from OPENAI_API_KEY env var.
        """
        api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self.client = AsyncOpenAI(api_key=api_key)

    async def get_or_create_project_vector_store(
        self, project_id: UUID, project_name: str
    ) -> str:
        """
        Get or create an OpenAI Vector Store for a project.

        Args:
            project_id: The project UUID.
            project_name: Human-readable project name.

        Returns:
            OpenAI vector store ID.
        """
        # Check if vector store already exists in our database
        response = (
            supabase.table("project_vector_stores")
            .select("openai_vector_store_id")
            .eq("project_id", str(project_id))
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]["openai_vector_store_id"]

        # Create new vector store in OpenAI
        vector_store = await self.client.vector_stores.create(
            name=f"Project: {project_name} ({project_id})",
            expires_after={"anchor": "last_active_at", "days": 365}
        )

        # Store in our database
        supabase.table("project_vector_stores").insert(
            {
                "project_id": str(project_id),
                "openai_vector_store_id": vector_store.id,
            }
        ).execute()

        return vector_store.id

    async def upload_and_add_file(
        self,
        document_id: UUID,
        project_id: UUID,
        file_bytes: bytes,
        filename: str,
    ) -> tuple[str, str]:
        """
        Upload a file to OpenAI and add it to the project's vector store.

        Args:
            document_id: The document UUID in our database.
            project_id: The project UUID.
            file_bytes: The PDF file content.
            filename: Original filename.

        Returns:
            Tuple of (openai_file_id, openai_vector_store_file_id).
        """
        # Get or create the vector store for this project
        # First, get project name
        project_response = (
            supabase.table("projects")
            .select("name")
            .eq("id", str(project_id))
            .single()
            .execute()
        )
        project_name = project_response.data["name"] if project_response.data else "Unknown"

        vector_store_id = await self.get_or_create_project_vector_store(
            project_id, project_name
        )

        # Upload file to OpenAI
        file_object = await self.client.files.create(
            file=(filename, file_bytes),
            purpose="assistants"
        )

        # Add file to vector store
        vector_store_file = await self.client.vector_stores.files.create(
            vector_store_id=vector_store_id,
            file_id=file_object.id
        )

        # Store OpenAI IDs directly in project_library_documents
        supabase.table("project_library_documents").update(
            {
                "openai_file_id": file_object.id,
                "openai_vector_store_file_id": vector_store_file.id,
                "index_status": "processing",
            }
        ).eq("id", str(document_id)).execute()

        return file_object.id, vector_store_file.id

    async def check_file_status(self, document_id: UUID) -> Optional[str]:
        """
        Check the indexing status of a document in OpenAI.

        Args:
            document_id: The document UUID.

        Returns:
            Status string: 'not_indexed', 'pending', 'processing', 'completed', 'failed', or None if not found.
        """
        response = (
            supabase.table("project_library_documents")
            .select("index_status, openai_vector_store_file_id")
            .eq("id", str(document_id))
            .execute()
        )

        if not response.data or len(response.data) == 0:
            return None

        return response.data[0].get("index_status", "not_indexed")

    async def update_file_status(
        self, document_id: UUID, status: str, error_message: Optional[str] = None
    ) -> None:
        """
        Update the indexing status of a document.

        Args:
            document_id: The document UUID.
            status: New status value ('not_indexed', 'pending', 'processing', 'completed', 'failed').
            error_message: Optional error message if status is 'failed'.
        """
        update_data = {"index_status": status}
        if error_message:
            update_data["index_error"] = error_message

        supabase.table("project_library_documents").update(update_data).eq(
            "id", str(document_id)
        ).execute()

    async def remove_file_from_vector_store(self, document_id: UUID) -> None:
        """
        Remove a file from its vector store when document is deleted.

        Args:
            document_id: The document UUID.
        """
        # Get the OpenAI file info
        response = (
            supabase.table("project_library_documents")
            .select("openai_file_id")
            .eq("id", str(document_id))
            .execute()
        )

        if not response.data or len(response.data) == 0 or not response.data[0].get("openai_file_id"):
            return

        openai_file_id = response.data[0]["openai_file_id"]

        # Delete from OpenAI (optional - files will expire anyway)
        try:
            if openai_file_id:
                await self.client.files.delete(openai_file_id)
        except Exception:
            # Ignore errors - file might already be deleted
            pass

    async def get_vector_store_id(self, project_id: UUID) -> Optional[str]:
        """
        Get the OpenAI vector store ID for a project.

        Args:
            project_id: The project UUID.

        Returns:
            OpenAI vector store ID or None if not found.
        """
        response = (
            supabase.table("project_vector_stores")
            .select("openai_vector_store_id")
            .eq("project_id", str(project_id))
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]["openai_vector_store_id"]
        return None
