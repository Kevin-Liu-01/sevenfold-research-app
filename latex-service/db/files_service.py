import logging
import os
from uuid import UUID

from dotenv import load_dotenv

from dto.files_types import FileRecord

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

    def get_file_record(self, file_id: UUID) -> FileRecord:
        """Fetch a file record from the database."""
        try:
            response = self.supabase.table(self.files_table).select("*").eq("id", str(file_id)).execute()
            data = response.data[0]
            return FileRecord(**data)
        except Exception as exc:
            logger.error("Error fetching file record: %s", exc)
            raise Exception("Failed to fetch file record") from exc

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

    def download_file(self, project_id: UUID, file_id: UUID) -> bytes:
        """Return the file bytes from storage."""
        try:
            storage_path = self._get_storage_path(project_id, file_id)
            response = self.supabase.storage.from_(self.storage_bucket).download(storage_path)
            if response.error:
                raise Exception(response.error.message)
            return response.data
        except Exception as exc:
            logger.error("Error downloading file: %s", exc)
            raise Exception("Failed to download file") from exc
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
