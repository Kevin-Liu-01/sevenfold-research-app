import { useState } from "react";
import { libraryApi } from "../api/libraryApi";
import type { LibraryDocument } from "@/shared/types/domain";

interface UseDocumentActionsOptions {
  activeProjectId: string | null;
  onUpdate: (doc: LibraryDocument) => void;
  onRemove: (docId: string) => void;
  onError: (error: string) => void;
}

export const useDocumentActions = ({
  activeProjectId,
  onUpdate,
  onRemove,
  onError,
}: UseDocumentActionsOptions) => {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startRename = (doc: LibraryDocument) => {
    setEditingDocId(doc.id);
    setEditValue(doc.title);
  };

  const saveRename = async (doc: LibraryDocument) => {
    if (
      !activeProjectId ||
      !editValue.trim() ||
      editValue.trim() === doc.title
    ) {
      cancelRename();
      return;
    }
    try {
      const updated = await libraryApi.rename(
        activeProjectId,
        doc.id,
        editValue.trim()
      );
      onUpdate(updated);
      cancelRename();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to rename document.";
      onError(errorMessage);
      cancelRename();
    }
  };

  const cancelRename = () => {
    setEditingDocId(null);
    setEditValue("");
  };

  const downloadDocument = async (doc: LibraryDocument) => {
    if (!doc.download_url) {
      onError("Download URL not available.");
      return;
    }
    try {
      const response = await fetch(doc.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename || `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to download document.";
      onError(errorMessage);
    }
  };

  const deleteDocument = async (doc: LibraryDocument) => {
    if (!activeProjectId) return;
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }
    try {
      await libraryApi.remove(activeProjectId, doc.id);
      onRemove(doc.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete document.";
      onError(errorMessage);
    }
  };

  return {
    editingDocId,
    editValue,
    startRename,
    saveRename,
    cancelRename,
    setEditValue,
    downloadDocument,
    deleteDocument,
  };
};
