import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { libraryApi } from "./api/libraryApi";
import type { LibraryDocument } from "@/shared/types/domain";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";

interface UploadPaperDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onUploaded: (doc: LibraryDocument) => void;
}

export const UploadPaperDialog = ({
  projectId,
  open,
  onClose,
  onUploaded,
}: UploadPaperDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) {
    return null;
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      setSelectedFile(null);
      setError("Only PDF files are supported.");
      return;
    }
    setSelectedFile(file);
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setError(null);
    fileInputRef.current?.value && (fileInputRef.current.value = "");
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select a PDF before uploading.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const document = await libraryApi.upload(projectId, selectedFile);
      onUploaded(document);
      resetDialog();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload paper.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload paper</CardTitle>
          <CardDescription>Accepted format: PDF only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="library-upload">Select file</FieldLabel>
                <Input
                  ref={fileInputRef}
                  id="library-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </Field>
              {selectedFile && (
                <div className="rounded-md border border-border-soft bg-surface-base px-3 py-2 text-xs text-text-secondary">
                  <p className="font-medium text-text-primary">{selectedFile.name}</p>
                  <p>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                    {new Date(selectedFile.lastModified).toLocaleDateString()}
                  </p>
                </div>
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
              <Field>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

