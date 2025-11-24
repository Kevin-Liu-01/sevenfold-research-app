import logging
import os
from uuid import UUID

from dotenv import load_dotenv

from dto.files_types import FileCreate, FileRecord

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

STORAGE_BUCKET = os.getenv("FILES_BUCKET", "files")


class FilesService:
    def __init__(self, supabase_client, storage_bucket: str = STORAGE_BUCKET):
        self.supabase = supabase_client
        self.storage_bucket = storage_bucket

    def create_file_record(self, record: FileCreate) -> FileRecord:
        """Insert a file record in the database."""
        try:
            response = self.supabase.table("files").insert(record.model_dump(mode='json')).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error creating file record: %s", exc)
            raise Exception("Failed to create file record") from exc

    def get_file_record(self, file_id: UUID) -> FileRecord:
        """Fetch a file record from the database."""
        try:
            response = self.supabase.table("files").select("*").eq("id", str(file_id)).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error fetching file record: %s", exc)
            raise Exception("Failed to fetch file record") from exc

    def update_file_record(self, file_id: UUID, updates: dict) -> FileRecord:
        """Update a file record in the database."""
        try:
            response = self.supabase.table("files").update(updates).eq("id", str(file_id)).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error updating file record: %s", exc)
            raise Exception("Failed to update file record") from exc

    def delete_file_record(self, file_id: UUID) -> None:
        """Delete a file record in the database."""
        try:
            self.supabase.table("files").delete().eq("id", str(file_id)).execute()
        except Exception as exc:
            logger.error("Error deleting file record: %s", exc)
            raise Exception("Failed to delete file record") from exc

    def list_files(self, project_id: UUID) -> list[FileRecord]:
        """List all file records for a given project."""
        try:
            response = (
                self.supabase.table("files").select("*").eq("project_id", str(project_id)).execute()
            )
            return [FileRecord(**item) for item in response.data]
        except Exception as exc:
            logger.error("Error listing files: %s", exc)
            raise Exception("Failed to list files") from exc

    def get_presigned_upload_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for uploading a file to Supabase Storage."""
        try:
            file_path = self._get_storage_path(project_id, id)
            response = self.supabase.storage.from_(self.storage_bucket).create_signed_url(
                file_path, 3600, method="PUT"
            )
            return response.signed_url
        except Exception as exc:
            logger.error("Error generating presigned upload URL: %s", exc)
            raise Exception("Failed to generate presigned upload URL") from exc

    def get_presigned_download_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for downloading a file from Supabase Storage."""
        try:
            file_path = self._get_storage_path(project_id, id)
            response = self.supabase.storage.from_(self.storage_bucket).create_signed_url(
                file_path, 3600, method="GET"
            )
            return response.signed_url
        except Exception as exc:
            logger.error("Error generating presigned download URL: %s", exc)
            raise Exception("Failed to generate presigned download URL") from exc

    # -------------------------------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------------------------------

    def _get_storage_path(self, project_id: UUID, file_id: UUID) -> str:
        """Construct the storage path for a given file."""
        return f"{project_id}/{file_id}"
