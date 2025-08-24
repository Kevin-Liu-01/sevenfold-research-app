// src/components/viewers/PaperDetailsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../auth/supabaseClient";
import type { Paper } from "../../../schema/db-types";

type Props = {
    paper: Paper | null;
    onClose: () => void; // parent should set selectedPaper(null)
    onAddToProject: (paper: Paper) => Promise<void> | void;
};

const PaperDetailsModal: React.FC<Props> = ({ paper, onClose, onAddToProject }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);

    // Close on ESC
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    // Always call hooks in the same order — compute date string even when paper is null
    const dateStr = useMemo(() => {
        const y = paper?.year != null ? String(paper.year) : "";
        const m = paper?.month ? String(paper.month).padStart(2, "0") : "";
        const d = paper?.day ? String(paper.day).padStart(2, "0") : "";
        const joined = [y, m, d].filter(Boolean).join("-");
        return joined || null;
    }, [paper?.year, paper?.month, paper?.day]);

    // Safe early return AFTER all hooks
    if (!paper) return null;

    // Resolve direct or signed URL for PDF
    const resolvePdfUrl = async (): Promise<string | null> => {
        if (!paper.pdf_uri) return null;
        if (/^https?:\/\//i.test(paper.pdf_uri)) return paper.pdf_uri;

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session?.access_token) return null;

            const filePath = paper.pdf_uri.replace(/^library\//, "");
            const resp = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/library/${encodeURIComponent(filePath)}/signed-url`,
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            if (!resp.ok) return null;
            const json = await resp.json();
            return json.signed_url ?? null;
        } catch {
            return null;
        }
    };

    const openPdf = async () => {
        if (!paper.pdf_uri) return;
        setPdfBusy(true);
        try {
            const url = await resolvePdfUrl();
            if (url) window.open(url, "_blank", "noopener,noreferrer");
        } finally {
            setPdfBusy(false);
        }
    };

    const handleAdd = async () => {
        setIsAdding(true);
        try {
            await onAddToProject(paper);
            onClose(); // close after successful add
        } finally {
            setIsAdding(false);
        }
    };

    const onBackdropMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onMouseDown={onBackdropMouseDown}
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl p-6 shadow-lg">
                {/* Title (opens PDF if available) */}
                <div className="pr-2">
                    {paper.pdf_uri ? (
                        <button
                            onClick={openPdf}
                            disabled={pdfBusy}
                            className="text-left text-xl font-semibold text-gray-900 hover:underline disabled:opacity-50"
                            title="View PDF"
                        >
                            {paper.title}
                        </button>
                    ) : (
                        <h3 className="text-xl font-semibold text-gray-900">{paper.title}</h3>
                    )}
                </div>

                {/* Labeled metadata */}
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                    {!!paper.authors?.length && (
                        <div>
                            <span className="font-medium text-gray-900">Authors:</span>{" "}
                            {paper.authors.join(", ")}
                        </div>
                    )}
                    {paper.year != null && (
                        <div>
                            <span className="font-medium text-gray-900">Year:</span> {paper.year}
                        </div>
                    )}
                    {dateStr && (
                        <div>
                            <span className="font-medium text-gray-900">Date:</span> {dateStr}
                        </div>
                    )}
                    {paper.category && (
                        <div>
                            <span className="font-medium text-gray-900">Category:</span>{" "}
                            {paper.category}
                        </div>
                    )}
                    {paper.doi && (
                        <div>
                            <span className="font-medium text-gray-900">DOI:</span>{" "}
                            <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                            >
                                {paper.doi}
                            </a>
                        </div>
                    )}
                    {paper.pdf_uri && (
                        <div>
                            <span className="font-medium text-gray-900">PDF:</span>{" "}
                            <button
                                onClick={openPdf}
                                disabled={pdfBusy}
                                className="text-blue-600 hover:underline disabled:opacity-50"
                            >
                                View PDF
                            </button>
                        </div>
                    )}
                </div>

                {/* Abstract */}
                {paper.abstract && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Abstract</h4>
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed max-h-72 overflow-auto">
                            {paper.abstract}
                        </p>
                    </div>
                )}

                {/* Footer: Cancel + Add to Project */}
                <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="px-4 py-2 text-sm rounded-lg bg-kets-green text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAdding ? "Adding…" : "Add to Project"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaperDetailsModal;
