import { useMemo, useState } from "react";
import { UploadPaperDialog } from "./UploadPaperDialog";
import { useAppStore } from "@/shared/state/appStore";
import type { LibraryDocument } from "@/shared/types/domain";
import { LibraryHeader } from "./components/LibraryHeader";
import { LibraryContent } from "./components/LibraryContent";
import { useLibraryDocuments } from "./hooks/useLibraryDocuments";
import { useDocumentActions } from "./hooks/useDocumentActions";

export const LibraryPanel = () => {
  const { activeProjectId, selectedLibraryDocument, setSelectedLibraryDocument, setCenterPaneView } = useAppStore();
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const {
    documents,
    filteredDocuments: allFilteredDocuments,
    loading,
    error,
    addDocument,
    updateDocument,
    removeDocument,
    setError,
  } = useLibraryDocuments({
    activeProjectId,
  });

  const {
    editingDocId,
    editValue,
    startRename,
    saveRename,
    cancelRename,
    setEditValue,
    downloadDocument,
    deleteDocument,
  } = useDocumentActions({
    activeProjectId,
    onUpdate: (updated) => {
      updateDocument(updated);
      if (selectedLibraryDocument?.id === updated.id) {
        setSelectedLibraryDocument(updated);
      }
    },
    onRemove: (docId) => {
      removeDocument(docId);
      if (selectedLibraryDocument?.id === docId) {
        setSelectedLibraryDocument(null);
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  const filteredDocuments = useMemo(() => {
    if (!filter) {
      return allFilteredDocuments;
    }
    const query = filter.toLowerCase();
    return allFilteredDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.original_filename.toLowerCase().includes(query),
    );
  }, [allFilteredDocuments, filter]);

  const handleUploaded = (doc: LibraryDocument) => {
    addDocument(doc);
    setFilter("");
  };

  const handleDocumentSelect = (doc: LibraryDocument) => {
    setSelectedLibraryDocument(doc);
    setCenterPaneView("reading");
  };

  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <LibraryHeader
        searchValue={filter}
        onSearchChange={setFilter}
        onUploadClick={() => setDialogOpen(true)}
        isProjectSelected={!!activeProjectId}
      />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <LibraryContent
            activeProjectId={activeProjectId}
            loading={loading}
            error={error}
            documents={documents}
            filteredDocuments={filteredDocuments}
            selectedDocumentId={selectedLibraryDocument?.id || null}
            editingDocId={editingDocId}
            editValue={editValue}
            hoveredDocId={hoveredDocId}
            openDropdownId={openDropdownId}
            onDocumentSelect={handleDocumentSelect}
            onEditChange={setEditValue}
            onEditSave={saveRename}
            onEditCancel={cancelRename}
            onHover={setHoveredDocId}
            onMenuOpenChange={setOpenDropdownId}
            onRename={startRename}
            onDownload={downloadDocument}
            onDelete={deleteDocument}
          />
        </div>
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

