// src/components/viewers/PaperDetailsModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import type { Paper } from "../../../schema/db-types";
import { useWorkbench } from "../context/WorkbenchContext";
import Modal from "../components/ui/Modal";

type Props = {
    paper: Paper;
    onClose: () => void;
    onAddToProject: (paper: Paper) => Promise<void> | void;
};

const PaperDetailsModal: React.FC<Props> = ({ paper, onClose, onAddToProject }) => {
    const { papers } = useWorkbench();

    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);
    // const [pdfBusy, setPdfBusy] = useState(false);

    // This is a function to check if the paper is already in the project
    // Since the paper object has an `id` field that uniquely identifies it,
    // we can use that to determine if it's already added.
    const isAlreadyInProject = useMemo(() => {
        if (!paper) return false;
        return papers.some((p) => p.id === paper.id);
    }, [paper, papers]);

    // keep added state synced
    useEffect(() => {
        setAdded(isAlreadyInProject);
    }, [isAlreadyInProject]);

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    const dateStr = useMemo(() => {
        const y = paper.year != null ? String(paper.year) : "";
        const m = paper.month ? String(paper.month).padStart(2, "0") : "";
        const d = paper.day ? String(paper.day).padStart(2, "0") : "";
        return [y, m, d].filter(Boolean).join("-") || null;
    }, [paper.year, paper.month, paper.day]);

    const handleAdd = async () => {
        if (isAdding) return;
        setIsAdding(true);
        try {
            await onAddToProject(paper);
            setAdded(true);
        } finally {
            setIsAdding(false);
        }
    };

    //   // Safe early return AFTER all hooks
    // if (!paper) return null;

    // // Resolve direct or signed URL for PDF
    // const resolvePdfUrl = async (): Promise<string | null> => {
    //     if (!paper.pdf_uri) return null;
    //     if (/^https?:\/\//i.test(paper.pdf_uri)) return paper.pdf_uri;

    //     try {
    //         const {
    //             data: { session },
    //         } = await supabase.auth.getSession();
    //         if (!session?.access_token) return null;

    //         const filePath = paper.pdf_uri.replace(/^library\//, "");
    //         const resp = await fetch(
    //             `${import.meta.env.VITE_API_BASE_URL}/papers/library/${encodeURIComponent(filePath)}/signed-url`,
    //             { headers: { Authorization: `Bearer ${session.access_token}` } }
    //         );
    //         if (!resp.ok) return null;
    //         const json = await resp.json();
    //         return json.signed_url ?? null;
    //     } catch {
    //         return null;
    //     }
    // };

    // const openPdf = async () => {
    //     if (!paper.pdf_uri) return;
    //     setPdfBusy(true);
    //     try {
    //         const url = await resolvePdfUrl();
    //         if (url) window.open(url, "_blank", "noopener,noreferrer");
    //     } finally {
    //         setPdfBusy(false);
    //     }
    // };

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[640px] max-w-full transition-all duration-300">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h3 className="text-2xl font-bold text-black leading-snug pr-6">
                        {paper.title}
                    </h3>
                    <button onClick={onClose} className="text-black/60 hover:text-black">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Meta */}
                <div className="mt-3 space-y-1 text-sm text-black/80">
                    {!!paper.authors?.length && (
                        <div>
                            <span className="font-semibold">Authors:</span>{" "}
                            {paper.authors.join(", ")}
                        </div>
                    )}
                    {paper.year && (
                        <div>
                            <span className="font-semibold">Year:</span> {paper.year}
                        </div>
                    )}
                    {dateStr && (
                        <div>
                            <span className="font-semibold">Date:</span> {dateStr}
                        </div>
                    )}
                    {paper.category && (
                        <div>
                            <span className="font-semibold">Category:</span> {paper.category}
                        </div>
                    )}
                    {paper.doi && (
                        <div>
                            <span className="font-semibold">DOI:</span>{" "}
                            <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-kets-orange hover:underline break-all"
                            >
                                {paper.doi}
                            </a>
                        </div>
                    )}
                </div>

                {/* Abstract */}
                {paper.abstract && (
                    <div className="mt-5">
                        <h4 className="text-sm font-semibold text-black uppercase tracking-wide">
                            Abstract
                        </h4>
                        <p className="mt-2 text-sm text-black/70 leading-relaxed max-h-72 overflow-auto">
                            {paper.abstract}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t flex flex-col items-end gap-3">
                    {added && (
                        <div className="flex items-center gap-2 text-kets-orange font-semibold">
                            <span className="material-icons">check_circle</span>
                            Added to project!
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-1 text-sm flex items-center gap-1 rounded-lg border border-black/20 text-black bg-white hover:bg-black/5"
                        >
                            <span className="material-icons text-sm">close</span>
                            Close
                        </button>
                        {!added && (
                            <button
                                onClick={handleAdd}
                                disabled={isAdding}
                                className="px-4 py-2 text-sm flex items-center gap-2 rounded-lg bg-kets-green text-white font-semibold shadow hover:opacity-90 disabled:opacity-50"
                            >
                                {isAdding ? (
                                    <>
                                        <span className="material-icons animate-spin text-sm">
                                            autorenew
                                        </span>
                                        Adding…
                                    </>
                                ) : (
                                    <>Add to Project</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PaperDetailsModal;
