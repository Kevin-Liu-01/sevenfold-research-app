import { useCallback, useEffect, useMemo, useState } from "react";
import { libraryApi } from "../api/libraryApi";
import type { LibraryDocument } from "@/shared/types/domain";

interface UseLibraryDocumentsOptions {
  activeProjectId: string | null;
  onError?: (error: string) => void;
}

export const useLibraryDocuments = ({
  activeProjectId,
  onError,
}: UseLibraryDocumentsOptions) => {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!activeProjectId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await libraryApi.list(activeProjectId);
      setDocuments(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load library.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, onError]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    return documents;
  }, [documents]);

  const addDocument = useCallback((doc: LibraryDocument) => {
    setDocuments((prev) => [
      doc,
      ...prev.filter((existing) => existing.id !== doc.id),
    ]);
  }, []);

  const updateDocument = useCallback((updated: LibraryDocument) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  }, []);

  const removeDocument = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  return {
    documents,
    filteredDocuments,
    loading,
    error,
    addDocument,
    updateDocument,
    removeDocument,
    setError: setErrorState,
    reload: loadDocuments,
  };
};
