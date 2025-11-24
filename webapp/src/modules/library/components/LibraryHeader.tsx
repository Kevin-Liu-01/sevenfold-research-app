import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface LibraryHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  isProjectSelected: boolean;
}

export const LibraryHeader = ({
  searchValue,
  onSearchChange,
  onUploadClick,
  isProjectSelected,
}: LibraryHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between gap-3" />
      <Button
        className="h-10 w-full bg-accent text-white hover:bg-accent/90"
        onClick={onUploadClick}
        disabled={!isProjectSelected}
      >
        Upload PDF
      </Button>
      <Input
        type="search"
        placeholder="Search titles…"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        disabled={!isProjectSelected}
        className="focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </>
  );
};

