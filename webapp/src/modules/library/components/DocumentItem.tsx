import type { LibraryDocument } from "@/shared/types/domain";
import { DocumentRenameInput } from "./DocumentRenameInput";
import { DocumentActionsMenu } from "./DocumentActionsMenu";

interface DocumentItemProps {
  document: LibraryDocument;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  isHovered: boolean;
  isMenuOpen: boolean;
  onSelect: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onHover: (hovered: boolean) => void;
  onMenuOpenChange: (open: boolean) => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const DocumentItem = ({
  document,
  isSelected,
  isEditing,
  editValue,
  isHovered,
  isMenuOpen,
  onSelect,
  onEditChange,
  onEditSave,
  onEditCancel,
  onHover,
  onMenuOpenChange,
  onRename,
  onDownload,
  onDelete,
}: DocumentItemProps) => {
  const showMenu = isHovered || isMenuOpen;

  return (
    <li
      className="group relative"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => {
        if (!isMenuOpen) {
          onHover(false);
        }
      }}
    >
      {isEditing ? (
        <DocumentRenameInput
          value={editValue}
          onChange={onEditChange}
          onSave={onEditSave}
          onCancel={onEditCancel}
        />
      ) : (
        <button
          onClick={onSelect}
          className={`relative w-full px-3 py-2 text-sm text-left transition-colors rounded-md overflow-hidden ${isSelected
            ? "bg-accent/10 text-accent font-medium"
            : "hover:bg-surface-contrast/50"
            }`}
        >
          <span
            className="block pr-8"
            style={{
              maskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)",
              WebkitMaskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)",
            }}
          >
            {document.title}
          </span>
        </button>
      )}
      {showMenu && (
        <div
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => {
            if (!isMenuOpen) {
              onHover(false);
            }
          }}
        >
          <DocumentActionsMenu
            isOpen={isMenuOpen}
            onOpenChange={(open) => {
              onMenuOpenChange(open);
              if (!open) {
                onHover(false);
              }
            }}
            onRename={onRename}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        </div>
      )}
    </li>
  );
};

