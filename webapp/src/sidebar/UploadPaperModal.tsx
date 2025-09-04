import React, { useState, useRef, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedPaperPayload {
    file: File;
    addToIndex: boolean;
    title?: string;
    authors?: string[];
    publicationDate?: string | null;
    doi?: string;
    tags?: string[];
    notes?: string | null;
    abstractPages?: number[];
    titlePage?: number | null;
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
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [addToIndex, setAddToIndex] = useState(true);

    // step 2
    const [titlePage, setTitlePage] = useState<number | null>(null);
    const [abstractPages, setAbstractPages] = useState<number[]>([]);

    // step 3
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
            abstractPages,
            titlePage,
        });
    };

    const steps = [
        { label: "Upload", color: "bg-kets-orange" },
        { label: "Pages", color: "bg-kets-green" },
        { label: "Metadata", color: "bg-kets-yellow" },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl w-lg text-sm shadow-xl h-[500px] flex flex-col space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 text-center">Upload Paper</h2>

            {/* header with steps */}
            <div className="mx-auto">
                <div className="flex items-center justify-between w-full relative">
                    {steps.map((s, idx) => {
                        const stepNum = (idx + 1) as 1 | 2 | 3;
                        const active = stepNum === step;
                        const completed = stepNum < step;

                        return (
                            <div key={s.label} className="flex flex-1 items-center">
                                {/* step circle */}
                                <div className="flex flex-col items-center mx-[-0.7rem] relative z-10">
                                    <div
                                        className={`
                                            w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium
                                            ${active ? `${s.color} text-white border-transparent` : ""}
                                            ${completed ? `${s.color} text-white border-transparent` : ""}
                                            ${!active && !completed ? "bg-white border-gray-300 text-gray-500" : ""}
                                        `}
                                    >
                                        {completed ? "✓" : stepNum}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs ${
                                            active ? "font-medium text-gray-900" : "text-gray-500"
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>

                                {/* connector (except after last step) */}
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 min-w-32 h-0.5 bg-gray-200 mb-6 relative">
                                        <motion.div
                                            className={`h-0.5 ${steps[idx].color} absolute left-0 top-0`}
                                            initial={{ width: "0%" }}
                                            animate={{ width: step > stepNum ? "100%" : "0%" }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3 }}
                            className="flex h-full flex-col space-y-3"
                        >
                            <div
                                onClick={openFileDialog}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`
        h-full w-full p-6 border-2 border-dashed rounded-lg cursor-pointer
        flex flex-col items-center justify-center text-gray-600 text-center
        transition-all duration-200
        ${dragOver ? "border-kets-orange-400 bg-kets-orange-200" : "border-kets-orange-300 bg-kets-orange-50"}
        hover:border-kets-orange-500 hover:bg-kets-orange-100
      `}
                            >
                                {!file ? (
                                    <>
                                        <span className="material-icons text-kets-orange-500 mb-3">
                                            file_copy
                                        </span>
                                        <span className="font-medium">
                                            Drag & drop PDF here, or click to select
                                        </span>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className="material-icons text-kets-green text-4xl">
                                            check_circle
                                        </span>
                                        <span className="truncate font-semibold text-gray-800">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent opening file dialog
                                                setFile(null);
                                            }}
                                            className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <p className="text-gray-600">
                                Select the title page and abstract pages:
                            </p>
                            <input
                                type="number"
                                placeholder="Title page #"
                                value={titlePage ?? ""}
                                onChange={(e) => setTitlePage(Number(e.target.value))}
                                className="w-full border px-2 py-1 rounded text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Abstract page(s), comma-separated"
                                value={abstractPages.join(",")}
                                onChange={(e) =>
                                    setAbstractPages(
                                        e.target.value
                                            .split(",")
                                            .map((n) => Number(n.trim()))
                                            .filter((n) => !isNaN(n))
                                    )
                                }
                                className="w-full border px-2 py-1 rounded text-sm"
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                        >
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={addToIndex}
                                    onChange={() => setAddToIndex(!addToIndex)}
                                    className="text-sm"
                                />
                                <span className="text-sm">
                                    Add to our index (improves your search results)
                                </span>
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
                                placeholder="Authors (comma-separated)"
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
                                placeholder="Tags (comma-separated)"
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-4">
                <button
                    onClick={onClose}
                    className="px-3 py-1 text-sm cursor-pointer text-gray-500"
                >
                    Cancel
                </button>
                <div className="flex space-x-2">
                    {step > 1 && (
                        <button
                            onClick={() => setStep((s) => (s === 2 ? 1 : 2))}
                            className="px-3 py-1 bg-gray-200 rounded text-sm"
                        >
                            Back
                        </button>
                    )}
                    {step < 3 && (
                        <button
                            onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                            disabled={step === 1 && !file}
                            className="px-3 py-1 bg-kets-orange-400 text-white rounded text-sm hover:bg-kets-orange-500 disabled:opacity-50"
                        >
                            Next
                        </button>
                    )}
                    {step === 3 && (
                        <button
                            onClick={handleSubmit}
                            disabled={!file || isUploading}
                            className="px-3 py-1 bg-kets-orange-400 text-white rounded text-sm hover:bg-kets-orange-500 disabled:opacity-50"
                        >
                            {isUploading ? "Uploading…" : "Submit"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadPaperModal;
