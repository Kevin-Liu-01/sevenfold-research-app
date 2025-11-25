import logging
import os
from uuid import UUID

from dotenv import load_dotenv

from dto.files_types import FileCreate, FileRecord

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

STORAGE_BUCKET = os.getenv("FILES_BUCKET", "files")
FILES_TABLE = os.getenv("FILES_TABLE", "project_files")


class FilesService:
    def __init__(
        self, 
        supabase_client,
        storage_bucket: str = STORAGE_BUCKET,
        files_table: str = FILES_TABLE
    ):
        self.supabase = supabase_client
        self.storage_bucket = storage_bucket
        self.files_table = files_table

    def create_file_record(self, record: FileCreate) -> FileRecord:
        """Insert a file record in the database."""
        try:
            response = self.supabase.table(self.files_table).insert(record.model_dump(mode='json')).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error creating file record: %s", exc)
            raise Exception("Failed to create file record") from exc

    def get_file_record(self, file_id: UUID) -> FileRecord:
        """Fetch a file record from the database."""
        try:
            response = self.supabase.table(self.files_table).select("*").eq("id", str(file_id)).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error fetching file record: %s", exc)
            raise Exception("Failed to fetch file record") from exc

    def update_file_record(self, file_id: UUID, updates: dict) -> FileRecord:
        """Update a file record in the database."""
        try:
            response = self.supabase.table(self.files_table).update(updates).eq("id", str(file_id)).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error updating file record: %s", exc)
            raise Exception("Failed to update file record") from exc

    def delete_file_record(self, file_id: UUID) -> None:
        """Delete a file record in the database."""
        try:
            self.supabase.table(self.files_table).delete().eq("id", str(file_id)).execute()
        except Exception as exc:
            logger.error("Error deleting file record: %s", exc)
            raise Exception("Failed to delete file record") from exc

    def delete_file_from_storage(self, project_id: UUID, file_id: UUID) -> None:
        """Delete a file from Supabase Storage."""
        try:
            file_path = self._get_storage_path(project_id, file_id)
            # check if file exists before deleting
            items = self.supabase.storage.from_(self.storage_bucket).list(str(project_id))
            for item in items:
                if item['name'] == str(file_id):
                    self.supabase.storage.from_(self.storage_bucket).remove([file_path])
                    return

            logger.warning("File %s not found in storage for deletion", file_path)
        except Exception as exc:
            logger.error("Error deleting file from storage: %s", exc)
            raise Exception("Failed to delete file from storage") from exc

    def list_files(self, project_id: UUID) -> list[FileRecord]:
        """List all file records for a given project."""
        try:
            response = (
                self.supabase.table(self.files_table).select("*").eq("project_id", str(project_id)).execute()
            )
            return [FileRecord(**item) for item in response.data]
        except Exception as exc:
            logger.error("Error listing files: %s", exc)
            raise Exception("Failed to list files") from exc

    def get_presigned_upload_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for uploading a file to Supabase Storage."""
        try:
            file_path = self._get_storage_path(project_id, id)
            response = self.supabase.storage.from_(self.storage_bucket).create_signed_upload_url(file_path)
            return self._extract_signed_url(response)
        except Exception as exc:
            logger.error("Error generating presigned upload URL: %s", exc)
            raise Exception("Failed to generate presigned upload URL") from exc

    def get_presigned_download_url(self, id: UUID, project_id: UUID) -> str:
        """Generate a presigned URL for downloading a file from Supabase Storage."""
        try:
            file_path = self._get_storage_path(project_id, id)
            response = self.supabase.storage.from_(self.storage_bucket).create_signed_url(file_path, 3600)
            return self._extract_signed_url(response)
        except Exception as exc:
            logger.error("Error generating presigned download URL: %s", exc)
            raise Exception("Failed to generate presigned download URL") from exc

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

