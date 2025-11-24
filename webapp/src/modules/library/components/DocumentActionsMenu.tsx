import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MoreVertical, Download, Trash2, Pencil } from "lucide-react";

interface DocumentActionsMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const DocumentActionsMenu = ({
  isOpen,
  onOpenChange,
  onRename,
  onDownload,
  onDelete,
}: DocumentActionsMenuProps) => {
  return (
    <div
      className="absolute right-2 top-1/2 -translate-y-1/2"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded-md hover:bg-surface-contrast/50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 text-text-secondary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
          className="bg-surface-base border-border-soft"
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
              onRename();
            }}
            className="hover:bg-surface-contrast/30 focus:bg-accent/10"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
              onDownload();
            }}
            className="hover:bg-surface-contrast/30 focus:bg-accent/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
              onDelete();
            }}
            variant="destructive"
            className="hover:bg-surface-contrast/30 focus:bg-red-50 text-red-600 data-[variant=destructive]:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

