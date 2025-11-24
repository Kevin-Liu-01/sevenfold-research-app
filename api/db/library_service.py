from pathlib import Path
from typing import List, Optional, Union
from uuid import UUID, uuid4

from fastapi import HTTPException

from db.supabase import supabase
from dto.library_types import LibraryDocument


class LibraryService:
    def __init__(self, supabase_client, storage_bucket: str = "project_library"):
        self.supabase = supabase_client
        self.storage_bucket = storage_bucket

    # ------------------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------------------

    def list_documents(self, project_id: UUID) -> List[LibraryDocument]:
        response = (
            self.supabase.table("project_library_documents")
            .select("*")
            .eq("project_id", str(project_id))
            .order("created_at", desc=True)
            .execute()
        )

        if getattr(response, "error", None):
            raise HTTPException(status_code=500, detail=response.error.message)

        documents: List[LibraryDocument] = []
        for doc in response.data:
            download_url = self._generate_signed_url(
                doc["storage_path"], doc["original_filename"]
            )
            documents.append(LibraryDocument(**{**doc, "download_url": download_url}))

        return documents

    def create_document_from_upload(
        self,
        *,
        project_id: UUID,
        upload_bytes: bytes,
        original_filename: str,
        title: Optional[str] = None,
        content_type: str = "application/pdf",
    ) -> LibraryDocument:
        safe_name = Path(original_filename or "document.pdf").name
        storage_path = f"{project_id}/{uuid4()}"

        storage_response = (
            self.supabase.storage.from_(self.storage_bucket).upload(
                storage_path,
                upload_bytes,
                {"content-type": content_type, "upsert": False},
            )
        )

        if getattr(storage_response, "error", None):
            raise HTTPException(status_code=500, detail="Failed to store PDF in Supabase")

        record_payload = {
            "project_id": str(project_id),
            "title": title or Path(safe_name).stem,
            "original_filename": safe_name,
            "storage_path": storage_path,
            "file_size_bytes": len(upload_bytes),
            "content_type": content_type,
        }

        insert_response = (
            self.supabase.table("project_library_documents")
            .insert(record_payload)
            .execute()
        )

        if getattr(insert_response, "error", None) or not insert_response.data:
            error = getattr(insert_response, "error", None)
            detail = error.message if error else "Failed to save library metadata"
            raise HTTPException(status_code=500, detail=detail)

        record = insert_response.data[0]
        download_url = self._generate_signed_url(
            record["storage_path"], record["original_filename"]
        )

        return LibraryDocument(**{**record, "download_url": download_url})

    # ------------------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------------------

    def _generate_signed_url(
        self, storage_path: str, download_name: Optional[str] = None
    ) -> Optional[str]:
        try:
            response = (
                self.supabase.storage.from_(self.storage_bucket).create_signed_url(
                    storage_path,
                    3600,
                    {"download": download_name} if download_name else None,
                )
            )
        except Exception:
            return None

        error = getattr(response, "error", None)
        if error:
            return None

        return self._extract_signed_url(response)

    @staticmethod
    def _extract_signed_url(response: Union[dict, object]) -> Optional[str]:
        if isinstance(response, dict):
            return (
                response.get("signedUrl")
                or response.get("signedURL")
                or response.get("signed_url")
            )

        return getattr(response, "signed_url", None) or getattr(
            response, "signedUrl", None
        )

    def get_download_url(self, project_id: UUID, document_id: UUID) -> Optional[str]:
        record_response = (
            self.supabase.table("project_library_documents")
            .select("storage_path", "original_filename")
            .eq("id", str(document_id))
            .single()
            .execute()
        )

        if getattr(record_response, "error", None) or not record_response.data:
            return None

        data = record_response.data
        return self._generate_signed_url(data["storage_path"], data["original_filename"])

    def rename_document(self, *, project_id: UUID, document_id: UUID, title: str) -> LibraryDocument:
        update_response = (
            self.supabase.table("project_library_documents")
            .update({"title": title})
            .eq("id", str(document_id))
            .eq("project_id", str(project_id))
            .execute()
        )

        if getattr(update_response, "error", None):
            raise HTTPException(status_code=500, detail=update_response.error.message)

        if not update_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        record = update_response.data[0]
        download_url = self._generate_signed_url(
            record["storage_path"], record["original_filename"]
        )
        return LibraryDocument(**{**record, "download_url": download_url})

    def delete_document(self, *, project_id: UUID, document_id: UUID) -> None:
        record_response = (
            self.supabase.table("project_library_documents")
            .select("id", "storage_path")
            .eq("id", str(document_id))
            .eq("project_id", str(project_id))
            .single()
            .execute()
        )

        if getattr(record_response, "error", None) or not record_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        storage_path = record_response.data["storage_path"]
        remove_response = self.supabase.storage.from_(self.storage_bucket).remove(
            [storage_path]
        )
        error = getattr(remove_response, "error", None)
        if error:
            raise HTTPException(status_code=500, detail="Failed to delete storage object")

        delete_response = (
            self.supabase.table("project_library_documents")
            .delete()
            .eq("id", str(document_id))
            .eq("project_id", str(project_id))
            .execute()
        )
        if getattr(delete_response, "error", None):
            raise HTTPException(status_code=500, detail="Failed to delete document")

