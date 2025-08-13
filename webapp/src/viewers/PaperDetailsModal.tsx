import React, { useState } from "react";
import Modal from "../components/ui/Modal";
// import supabase from "@/lib/supabase" // if needed

const PaperDetailsModal: React.FC<{
    paper: Paper | null;
    onClose: () => void;
    onAddToProject: (paper: Paper) => Promise<void> | void;
}> = ({ paper, onClose, onAddToProject }) => {
    const [isAddingToProject, setIsAddingToProject] = useState(false);

    if (!paper) return null;

    const handleViewPDF = async () => {
        if (!paper.pdf_uri) {
            console.error("No PDF URI available for this paper");
            return;
        }
        try {
            const { data, error: authErr } = await supabase.auth.getSession?.();
            if (authErr || !data?.session?.access_token) {
                console.error("No auth session found");
                return;
            }
            const filePath = paper.pdf_uri.replace("library/", "");
            const resp = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/library/${filePath}/signed-url`,
                { headers: { Authorization: `Bearer ${data.session.access_token}` } }
            );
            if (!resp.ok) {
                console.error("Failed to get signed URL for PDF");
                return;
            }
            const json = await resp.json();
            window.open(json.signed_url, "_blank");
        } catch (e) {
            console.error("Error getting PDF URL:", e);
        }
    };

    const handleAddClick = async () => {
        if (!paper) return;
        setIsAddingToProject(true);
        try {
            await onAddToProject(paper);
        } finally {
            setIsAddingToProject(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 text-sm">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold pr-6 line-clamp-2">{paper.title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label="Close modal"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Meta row */}
                {(paper.year || paper.authors?.length) && (
                    <div className="text-gray-600 flex flex-wrap items-center gap-1">
                        {paper.year && <span className="font-medium">{paper.year}</span>}
                        {paper.year && paper.authors?.length ? <span>•</span> : null}
                        {paper.authors?.length ? (
                            <span className="truncate">{paper.authors.join(", ")}</span>
                        ) : null}
                    </div>
                )}

                {/* DOI */}
                {paper.doi && (
                    <div className="text-gray-600">
                        <span className="font-medium">DOI: </span>
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

                {/* Abstract */}
                {paper.abstract && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Abstract</h4>
                        <p className="text-gray-700 leading-relaxed max-h-56 overflow-auto">
                            {paper.abstract}
                        </p>
                    </div>
                )}

                {/* Footer actions */}
                <div className="pt-4 border-t flex justify-end space-x-2">
                    <button onClick={onClose} className="px-3 py-1 text-sm cursor-pointer">
                        Cancel
                    </button>

                    {paper.pdf_uri && (
                        <button
                            onClick={handleViewPDF}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-800 cursor-pointer"
                        >
                            View PDF
                        </button>
                    )}

                    <button
                        onClick={handleAddClick}
                        disabled={isAddingToProject}
                        className="px-3 py-1 bg-blue-600 font-bold text-white cursor-pointer rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isAddingToProject ? "Adding…" : "Add to Project"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PaperDetailsModal;
