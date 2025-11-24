import type { LibraryDocument } from "@/shared/types/domain";
import { DocumentList } from "./DocumentList";

interface LibraryContentProps {
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
  documents: LibraryDocument[];
  filteredDocuments: LibraryDocument[];
  selectedDocumentId: string | null;
  editingDocId: string | null;
  editValue: string;
  hoveredDocId: string | null;
  openDropdownId: string | null;
  onDocumentSelect: (doc: LibraryDocument) => void;
  onEditChange: (value: string) => void;
  onEditSave: (doc: LibraryDocument) => void;
  onEditCancel: () => void;
  onHover: (docId: string | null) => void;
  onMenuOpenChange: (docId: string | null) => void;
  onRename: (doc: LibraryDocument) => void;
  onDownload: (doc: LibraryDocument) => void;
  onDelete: (doc: LibraryDocument) => void;
}

export const LibraryContent = ({
  activeProjectId,
  loading,
  error,
  documents,
  filteredDocuments,
  selectedDocumentId,
  editingDocId,
  editValue,
  hoveredDocId,
  openDropdownId,
  onDocumentSelect,
  onEditChange,
  onEditSave,
  onEditCancel,
  onHover,
  onMenuOpenChange,
  onRename,
  onDownload,
  onDelete,
}: LibraryContentProps) => {
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

  return (
    <DocumentList
      documents={documents}
      filteredDocuments={filteredDocuments}
      selectedDocumentId={selectedDocumentId}
      editingDocId={editingDocId}
      editValue={editValue}
      hoveredDocId={hoveredDocId}
      openDropdownId={openDropdownId}
      onDocumentSelect={onDocumentSelect}
      onEditChange={onEditChange}
      onEditSave={onEditSave}
      onEditCancel={onEditCancel}
      onHover={onHover}
      onMenuOpenChange={onMenuOpenChange}
      onRename={onRename}
      onDownload={onDownload}
      onDelete={onDelete}
    />
  );
};

