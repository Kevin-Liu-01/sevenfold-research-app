import { useCallback, useEffect, useMemo, useState } from "react";
import { libraryApi } from "./api/libraryApi";
import { UploadPaperDialog } from "./UploadPaperDialog";
import { useAppStore } from "@/shared/state/appStore";
import type { LibraryDocument } from "@/shared/types/domain";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export const LibraryPanel = () => {
  const { activeProjectId, selectedLibraryDocument, setSelectedLibraryDocument, setCenterPaneView } = useAppStore();
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelRename = useCallback(() => {
    // Placeholder for future rename UI; currently unused
    return;
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!activeProjectId) {
      setDocuments([]);
      cancelRename();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await libraryApi.list(activeProjectId);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library.");
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, cancelRename]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!filter) {
      return documents;
    }
    const query = filter.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.original_filename.toLowerCase().includes(query),
    );
  }, [documents, filter]);

  const handleUploaded = (doc: LibraryDocument) => {
    setDocuments((prev) => [doc, ...prev.filter((existing) => existing.id !== doc.id)]);
    setFilter("");
  };

  const handleDocumentClick = (doc: LibraryDocument) => {
    setSelectedLibraryDocument(doc);
    setCenterPaneView("reading");
  };

  const renderContent = () => {
    if (!activeProjectId) {
      return <p className="text-sm text-text-secondary">Select a project to view its library.</p>;
    }

    if (loading) {
      return <p className="text-sm text-text-secondary">Loading papers…</p>;
    }

    if (error) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="text-sm text-text-secondary">
          {documents.length === 0
            ? "No papers uploaded yet. Bring in PDFs to kick off indexing later."
            : "No matches for your search."}
        </div>
      );
    }

    return (
      <ul className="divide-y divide-border-soft">
        {filteredDocuments.map((doc) => (
          <li
            key={doc.id}
            onClick={() => handleDocumentClick(doc)}
            className={`px-3 py-2 text-sm transition-colors cursor-pointer ${selectedLibraryDocument?.id === doc.id
                ? "bg-accent/10 text-accent font-medium"
                : "hover:bg-surface-contrast"
              }`}
          >
            {doc.title}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-3" />
      <Button
        className="h-10 w-full bg-accent text-white hover:bg-accent/90"
        onClick={() => setDialogOpen(true)}
        disabled={!activeProjectId}
      >
        Upload PDF
      </Button>
      <Input
        type="search"
        placeholder="Search titles…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        disabled={!activeProjectId}
      />
      <div className="flex-1 overflow-hidden rounded-lg border border-border-soft bg-surface-base">
        <div className="h-full overflow-y-auto">{renderContent()}</div>
      </div>
      {activeProjectId && (
        <UploadPaperDialog
          projectId={activeProjectId}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
};

