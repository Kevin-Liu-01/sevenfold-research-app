import { Input } from "@/shared/components/ui/input";

interface DocumentRenameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const DocumentRenameInput = ({
  value,
  onChange,
  onSave,
  onCancel,
}: DocumentRenameInputProps) => {
  return (
    <div className="w-full px-3 py-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="h-8 text-sm"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

