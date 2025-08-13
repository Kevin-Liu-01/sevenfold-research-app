import React, { useState, useRef, type DragEvent } from "react";
import Modal from "../components/ui/Modal";
import type { Upload } from "lucide-react";
// import type { UploadedPaperPayload } from "../../../api.types";

interface UploadedPaperPayload {
    /** The PDF file to upload */
    file: File;
    /** Whether to enqueue indexing of this paper */
    addToIndex: boolean;
    /** Optional fallback title (will default to file.name if omitted) */
    title?: string;
    /** Optional list of authors */
    authors?: string[];
    /** Optional publication date in YYYY-MM-DD format */
    publicationDate?: string | null;
    /** Optional DOI string */
    doi?: string;
    /** Optional tags to attach */
    tags?: string[];
    /** Optional free‑form notes */
    notes?: string | null;
}

interface UploadPaperModalProps {
    onClose: () => void;
    onSubmit: (data: UploadedPaperPayload) => void;
    isUploading?: boolean;
}

const UploadPaperModal: React.FC<UploadPaperModalProps> = ({
    onClose,
    onSubmit,
    isUploading = false,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [addToIndex, setAddToIndex] = useState(true);
    const [title, setTitle] = useState("");
    const [authors, setAuthors] = useState("");
    const [pubDate, setPubDate] = useState<string>("");
    const [doi, setDoi] = useState("");
    const [tags, setTags] = useState<string>("");
    const [notes, setNotes] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };
    const handleDragLeave = () => setDragOver(false);

    const openFileDialog = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleSubmit = () => {
        if (!file) return;
        onSubmit({
            file,
            addToIndex,
            title: title.trim() || file.name,
            authors: authors
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean),
            publicationDate: pubDate || null,
            doi: doi || "",
            tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            notes: notes || null,
        });
    };

    return (
        <Modal onClose={onClose}>
            <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 text-sm">
                <h3 className="text-base font-semibold flex items-center">
                    <span className="material-icons mr-1">upload</span>
                    Upload a Paper
                </h3>

                <div
                    onClick={openFileDialog}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
            w-full p-4 border-2 border-dashed rounded cursor-pointer
            ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"}
            flex flex-col items-center justify-center text-gray-600
          `}
                >
                    {file ? (
                        <span className="truncate">{file.name}</span>
                    ) : (
                        <span>Drag &amp; drop PDF here, or click to select</span>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={addToIndex}
                        onChange={() => setAddToIndex(!addToIndex)}
                        className="text-sm"
                    />
                    <span className="text-sm">Add to our index (improves your search results)</span>
                </label>

                <input
                    type="text"
                    placeholder="Title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                />
                <input
                    type="text"
                    placeholder="Authors (comma‑separated)"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                />
                <input
                    type="date"
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                />
                <input
                    type="text"
                    placeholder="DOI (optional)"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                />
                <input
                    type="text"
                    placeholder="Tags (comma‑separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                />
                <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border px-2 py-1 rounded text-sm"
                    rows={3}
                />

                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-3 py-1 text-sm cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="px-3 py-1 bg-blue-600 font-bold text-white cursor-pointer rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isUploading ? "Uploading…" : "Upload"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UploadPaperModal;
