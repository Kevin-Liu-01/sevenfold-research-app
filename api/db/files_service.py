import os
import logging
from db.supabase import supabase
from dotenv import load_dotenv
from uuid import UUID

from dto.files_types import FileCreate, FileRecord

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class FilesService:

    def __init__(self, supabase_client, storage_bucket: str = "files"):
        self.supabase = supabase_client
        self.storage_bucket = storage_bucket

    def create_file_record(self, record: FileCreate) -> FileRecord:
        """Insert a file record in the database."""
        response = supabase.table("files").insert(record.dict()).execute()
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error creating file record: {error.message}")
            raise Exception("Failed to create file record")
        data = response.data[0]
        return FileRecord(**data)

    def get_file_record(self, file_id: UUID) -> FileRecord:
        """Fetch a file record from the database."""
        response = supabase.table("files").select("*").eq("id", str(file_id)).execute()
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error fetching file record: {error.message}")
            raise Exception("Failed to fetch file record")
        data = response.data[0]
        return FileRecord(**data)

    def update_file_record(self, file_id: UUID, updates: dict) -> FileRecord:
        """Update a file record in the database."""
        response = supabase.table("files").update(updates).eq("id", str(file_id)).execute()
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error updating file record: {error.message}")
            raise Exception("Failed to update file record")
        data = response.data[0]
        return FileRecord(**data)

    def delete_file_record(self, file_id: UUID) -> None:
        """Delete a file record from the database."""
        response = supabase.table("files").delete().eq("id", str(file_id)).execute()
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error deleting file record: {error.message}")
            raise Exception("Failed to delete file record")

    def list_files(self, project_id: UUID) -> list[FileRecord]:
        """List all file records for a given project."""
        response = supabase.table("files").select("*").eq("project_id", str(project_id)).execute()
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error listing files: {error.message}")
            raise Exception("Failed to list files")
        return [FileRecord(**item) for item in response.data]

    def get_presigned_upload_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for uploading a file to Supabase Storage."""
        file_path = self._get_storage_path(project_id, id)
        response = supabase.storage.from_(self.storage_bucket).create_signed_upload_url(
            file_path, 3600
        )
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error generating presigned URL: {error.message}")
            raise Exception("Failed to generate presigned URL")
        signed_url = self._extract_signed_url(response)
        if not signed_url:
            raise Exception("Failed to generate presigned URL")
        return signed_url

    def get_presigned_download_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for downloading a file from Supabase Storage."""
        file_path = self._get_storage_path(project_id, id)
        response = supabase.storage.from_(self.storage_bucket).create_signed_url(
            file_path, 3600
        )
        error = getattr(response, "error", None)
        if error:
            logger.error(f"Error generating presigned URL: {error.message}")
            raise Exception("Failed to generate presigned URL")
        signed_url = self._extract_signed_url(response)
        if not signed_url:
            raise Exception("Failed to generate presigned URL")
        return signed_url

# -------------------------------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------------------------------

    def _get_storage_path(self, project_id: UUID, file_id: UUID) -> str:
        """Construct the storage path for a given file."""
        return f"{project_id}/{file_id}"

    @staticmethod
    def _extract_signed_url(response):
        if isinstance(response, dict):
            return (
                response.get("signedUrl")
                or response.get("signedURL")
                or response.get("signed_url")
            )

        return getattr(response, "signed_url", None) or getattr(
            response, "signedUrl", None
        )

