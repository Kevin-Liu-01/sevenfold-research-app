import type { LibraryDocument } from "@/shared/types/domain";
import { DocumentItem } from "./DocumentItem";

interface DocumentListProps {
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

export const DocumentList = ({
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
}: DocumentListProps) => {
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
    <ul className="space-y-1">
      {filteredDocuments.map((doc) => (
        <DocumentItem
          key={doc.id}
          document={doc}
          isSelected={selectedDocumentId === doc.id}
          isEditing={editingDocId === doc.id}
          editValue={editValue}
          isHovered={hoveredDocId === doc.id}
          isMenuOpen={openDropdownId === doc.id}
          onSelect={() => onDocumentSelect(doc)}
          onEditChange={onEditChange}
          onEditSave={() => onEditSave(doc)}
          onEditCancel={onEditCancel}
          onHover={(hovered) => onHover(hovered ? doc.id : null)}
          onMenuOpenChange={(open) => onMenuOpenChange(open ? doc.id : null)}
          onRename={() => onRename(doc)}
          onDownload={() => onDownload(doc)}
          onDelete={() => onDelete(doc)}
        />
      ))}
    </ul>
  );
};

