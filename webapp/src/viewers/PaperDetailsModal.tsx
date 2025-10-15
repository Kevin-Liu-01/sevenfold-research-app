// src/components/viewers/PaperDetailsModal.tsx

import React, { useMemo, useEffect } from "react";
import type { Paper } from "../../../schema/db-types";
import Modal from "../components/ui/Modal";

type Props = {
    paper: Paper;
    onClose: () => void;
};

const PaperDetailsModal: React.FC<Props> = ({ paper, onClose }) => {
    // Helper function to truncate authors list
    const truncateAuthors = (authors: string[], maxAuthors: number = 10): string => {
        if (!authors || authors.length === 0) return "";
        if (authors.length <= maxAuthors) {
            return authors.join(', ');
        }
        return `${authors.slice(0, maxAuthors).join(', ')} et al. (+${authors.length - maxAuthors} more)`;
    };

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

    const handleGoToPaper = () => {
        if (paper.doi) {
            window.open(`https://doi.org/${paper.doi}`, '_blank', 'noopener,noreferrer');
        }
    };

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
                            {truncateAuthors(paper.authors)}
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
                                className="text-viix-orange hover:underline break-all"
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
                <div className="mt-8 pt-4 border-t flex justify-end">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-1 text-sm flex items-center gap-1 rounded-lg border border-black/20 text-black bg-white hover:bg-black/5"
                        >
                            <span className="material-icons text-sm">close</span>
                            Close
                        </button>
                        {paper.doi && (
                            <button
                                onClick={handleGoToPaper}
                                className="px-4 py-2 text-sm flex items-center gap-2 rounded-lg bg-viix-orange text-white font-semibold shadow hover:opacity-90"
                            >
                                <span className="material-icons text-sm">open_in_new</span>
                                Go to Paper
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PaperDetailsModal;
