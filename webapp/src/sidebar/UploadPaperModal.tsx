import React, { useState, useRef, useEffect, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UploadedPaperPayload } from "../../../schema/db-types";

// Imports for react-pdf; Note that the worker file must be imported through react-pdf/dist
// and not pdfjs-dist directly for Vite to handle it correctly. This means that they must be
// the same version as react-pdf itself; otherwise, there will be a version mismatch.
// If this error comes up, ensure the versions of react-pdf and pdfjs-dist match in package.json.
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Required setup for the pdf.js worker for Vite
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface UploadPaperModalProps {
    onClose: () => void;
    onSubmit: (data: Omit<UploadedPaperPayload, "addToIndex">) => void;
    onProcessPdf?: (data: { file: File; titlePage: number | null; abstractPages: number[] }) => Promise<any>;
    isUploading?: boolean;
}

const UploadPaperModal: React.FC<UploadPaperModalProps> = ({
    onClose,
    onSubmit,
    onProcessPdf,
    isUploading = false,
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedMetadata, setExtractedMetadata] = useState<any>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Step 2 state
    const [titlePage, setTitlePage] = useState<number | null>(null);
    const [abstractPages, setAbstractPages] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState<"title" | "abstract">("title");
    const [numPages, setNumPages] = useState<number | null>(null);

    // Step 3 state
    const [title, setTitle] = useState("");
    const [authors, setAuthors] = useState("");
    const [pubDate, setPubDate] = useState<string>("");
    const [doi, setDoi] = useState("");
    const [tags, setTags] = useState<string>("");
    const [notes, setNotes] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update metadata fields when extracted metadata is available
    useEffect(() => {
        if (extractedMetadata) {
            setTitle(extractedMetadata.title || "");
            setAuthors(extractedMetadata.authors ? extractedMetadata.authors.join(", ") : "");
            setPubDate(extractedMetadata.publicationDate || "");
            setDoi(extractedMetadata.doi || "");
            setTags(extractedMetadata.tags ? extractedMetadata.tags.join(", ") : "");
            setNotes(extractedMetadata.notes || "");
        }
    }, [extractedMetadata]);

    const handlePageSelection = (pageNumber: number) => {
        if (selectionMode === "title") {
            setTitlePage((current) => {
                const newTitlePage = current === pageNumber ? null : pageNumber;
                // Auto-switch to abstract mode after selecting a title page
                if (newTitlePage !== null) {
                    setSelectionMode("abstract");
                }
                return newTitlePage;
            });
        } else {
            setAbstractPages((current) => {
                const pages = new Set(current);
                if (pages.has(pageNumber)) {
                    pages.delete(pageNumber);
                } else {
                    pages.add(pageNumber);
                }
                return Array.from(pages).sort((a, b) => a - b);
            });
        }
    };

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
        if (e.target.files?.[0]) {
            const newFile = e.target.files[0];
            setFile(newFile);
            setNumPages(null);
            setTitlePage(null);
            setAbstractPages([]);
        }
    };

    const handleSubmit = () => {
        if (!file) return;
        onSubmit({
            file,
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

    const handleNextStep = async () => {
        if (step === 1 && file) {
            setStep(2);
        } else if (step === 2 && file) {
            // Process the PDF before moving to metadata step if function is provided
            if (onProcessPdf) {
                setIsProcessing(true);
                try {
                    const processedData = await onProcessPdf({
                        file,
                        titlePage,
                        abstractPages
                    });
                    
                    // Check if existing paper was found and linked
                    if (processedData?.hasExistingPaper && processedData?.skipMetadata) {
                        // Close modal immediately since paper was already linked
                        onClose();
                        return;
                    }
                    
                    setExtractedMetadata(processedData);
                } catch (error) {
                    console.error("Error processing PDF:", error);
                    // Still proceed to step 3 even if processing fails
                } finally {
                    setIsProcessing(false);
                }
            }
            setStep(3);
        }
    };

    const steps = [
        { label: "Upload", color: "bg-kets-orange" },
        { label: "Pages", color: "bg-kets-green" },
        { label: "Metadata", color: "bg-kets-yellow" },
    ];

    return (
        <div className="bg-slate-50 p-8 rounded-2xl w-2xl shadow-2xl h-[700px] flex flex-col space-y-4 border border-slate-200">
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-200 border-t-kets-orange rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-icons text-kets-orange text-3xl">
                                description
                            </span>
                        </div>
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-xl font-semibold text-slate-800">
                            Processing Your Paper
                        </h3>
                        <p className="text-base text-slate-600 max-w-sm">
                            We're extracting metadata and analyzing content from your PDF.
                            This may take a few moments.
                        </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold cursor-pointer text-slate-600 hover:text-slate-900"
                        >
                            Cancel
                        </button>
                        <div className="flex space-x-3">

                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold text-slate-800 text-center">
                        Upload Paper
                    </h2>
                    <div className="mx-auto">
                        <div className="flex items-center justify-between w-full relative">
                            {steps.map((s, idx) => {
                                const stepNum = (idx + 1) as 1 | 2 | 3;
                                const active = stepNum === step;
                                const completed = stepNum < step;
                                return (
                                    <div key={s.label} className="flex flex-1 items-center">
                                        <div className="flex flex-col items-center mx-[-0.7rem] relative z-10">
                                            <div
                                                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium ${active ? `${s.color} text-white border-transparent` : ""} ${completed ? `${s.color} text-white border-transparent` : ""} ${!active && !completed ? "bg-slate-100 border-slate-300 text-slate-500" : ""}`}
                                            >
                                                {completed ? "✓" : stepNum}
                                            </div>
                                            <span
                                                className={`mt-2 text-xs ${active ? "font-medium text-slate-900" : "text-slate-500"}`}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className="flex-1 min-w-32 h-0.5 bg-slate-200 mb-6 relative">
                                                <motion.div
                                                    className={`h-0.5 ${steps[idx].color} absolute left-0 top-0`}
                                                    initial={{ width: "0%" }}
                                                    animate={{
                                                        width: step > stepNum ? "100%" : "0%",
                                                    }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
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
                                        className={`h-full w-full p-6 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center text-kets-orange-800 text-center transition-all duration-200 ${dragOver ? "border-kets-orange-400 bg-kets-orange-200/50" : "border-kets-orange-300 bg-kets-orange-50/70"} hover:border-kets-orange-500 hover:bg-kets-orange-100/70`}
                                    >
                                        {!file ? (
                                            <>
                                                <span className="material-icons text-kets-orange-500 mb-3 text-3xl">
                                                    file_copy
                                                </span>
                                                <span className="font-semibold text-base">
                                                    Drag & drop PDF here, or click to select
                                                </span>
                                            </>
                                        ) : (
                                            <div className="flex items-center space-x-3">
                                                <span className="material-icons text-kets-green text-5xl">
                                                    check_circle
                                                </span>
                                                <span className="truncate font-semibold text-slate-800 text-base">
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                    }}
                                                    className="ml-2 text-slate-500 hover:text-red-500 transition-colors"
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
                                    className="h-full flex flex-col space-y-3"
                                >
                                    <div className="flex-none p-3 bg-white rounded-xl border border-slate-300 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="font-medium text-slate-700 text-sm">
                                                Selection Mode:
                                            </span>
                                            <div className="flex items-center space-x-3 text-sm">
                                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="selectionMode"
                                                        value="title"
                                                        checked={selectionMode === "title"}
                                                        onChange={() => setSelectionMode("title")}
                                                        className="form-radio text-kets-green-600 focus:ring-kets-green-500"
                                                    />
                                                    <span className="font-semibold text-kets-green-700">
                                                        Title Page
                                                    </span>
                                                </label>
                                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="selectionMode"
                                                        value="abstract"
                                                        checked={selectionMode === "abstract"}
                                                        onChange={() =>
                                                            setSelectionMode("abstract")
                                                        }
                                                        className="form-radio text-kets-yellow-500 focus:ring-kets-yellow-400"
                                                    />
                                                    <span className="font-semibold text-kets-yellow-600">
                                                        Abstract Page(s)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-semibold text-slate-800">
                                                Title Page:{" "}
                                                <span className="font-normal text-slate-600">
                                                    {titlePage || "None"}
                                                </span>
                                            </p>
                                            <p className="font-semibold text-slate-800">
                                                Abstract Pages:{" "}
                                                <span className="font-normal text-slate-600">
                                                    {abstractPages.length > 0
                                                        ? abstractPages.join(", ")
                                                        : "None"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full border border-slate-300 rounded-lg overflow-y-auto bg-slate-200 p-6 shadow-inner">
                                        <Document
                                            file={file}
                                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                            loading={
                                                <div className="text-center text-slate-500 font-semibold">
                                                    Loading PDF...
                                                </div>
                                            }
                                            error={
                                                <div className="text-center text-red-500 font-semibold">
                                                    Failed to load PDF file.
                                                </div>
                                            }
                                            className="flex flex-col items-center space-y-6"
                                        >
                                            {Array.from(new Array(numPages || 0), (_, index) => (
                                                <div
                                                    key={`page_${index + 1}`}
                                                    onClick={() => handlePageSelection(index + 1)}
                                                    className={`cursor-pointer rounded-md overflow-hidden shadow-lg transition-all duration-200 ${titlePage === index + 1 ? "ring-4 ring-offset-4 ring-kets-green" : ""} ${abstractPages.includes(index + 1) && titlePage !== index + 1 ? "ring-4 ring-offset-4 ring-kets-yellow" : ""}`}
                                                >
                                                    <Page
                                                        pageNumber={index + 1}
                                                        width={500}
                                                        renderAnnotationLayer={false}
                                                        renderTextLayer={false}
                                                    />
                                                </div>
                                            ))}
                                        </Document>
                                    </div>
                                </motion.div>
                            )}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-3 text-base h-full overflow-y-auto pr-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="Title (optional)"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Authors (comma-separated)"
                                        value={authors}
                                        onChange={(e) => setAuthors(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                    />
                                    <input
                                        type="date"
                                        value={pubDate}
                                        onChange={(e) => setPubDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="DOI (optional)"
                                        value={doi}
                                        onChange={(e) => setDoi(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Tags (comma-separated)"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                    />
                                    <textarea
                                        placeholder="Notes (optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full border border-slate-300 rounded-md placeholder-slate-400 focus:ring-1 focus:ring-kets-yellow-500 focus:border-kets-yellow-500 sm:text-sm px-3 py-2"
                                        rows={3}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold cursor-pointer text-slate-600 hover:text-slate-900"
                        >
                            Cancel
                        </button>
                        <div className="flex space-x-3">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep((s) => (s === 2 ? 1 : 2))}
                                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm font-semibold hover:bg-slate-300 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            {step < 3 && (
                                <button
                                    onClick={handleNextStep}
                                    disabled={(step === 1 && !file) || isProcessing}
                                    className="px-4 py-2 bg-kets-orange-500 text-white rounded-md text-sm font-semibold shadow-sm hover:bg-kets-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isProcessing ? "Processing..." : "Next"}
                                </button>
                            )}
                            {step === 3 && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!file || isUploading}
                                    className="px-4 py-2 bg-kets-orange-500 text-white rounded-md text-sm font-semibold shadow-sm hover:bg-kets-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isUploading ? "Uploading…" : "Submit"}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UploadPaperModal;
