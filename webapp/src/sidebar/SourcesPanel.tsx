import React, { useState, useMemo } from "react";

import { useWorkbench } from "../context/WorkbenchContext";
import type { Paper } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";

import UploadPaperModal from "./UploadPaperModal";
import Modal from "../components/ui/Modal"; // wrap all modals with this

const SearchBar: React.FC<{
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}> = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="bg-gray-50">
            <div className="flex h-full relative items-center justify-between gap-2">
                <span className="material-icons text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2">
                    search
                </span>
                <input
                    type="text"
                    placeholder="Search by title or author…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <span className="material-icons text-base">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const UploadPaperButton: React.FC<{
    onClick: () => void;
}> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center space-x-1 bg-kets-orange hover:bg-kets-orange-500 hover:cursor-pointer text-white text-sm font-medium px-2 py-1 rounded-md transition"
        >
            <span className="material-icons text-base">upload_file</span>
            <span>Upload Paper</span>
        </button>
    );
};

const PaperBox: React.FC<{
    paper: Paper;
    isSelected: boolean;
    onClick: () => void;
}> = ({ paper, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                ${isSelected ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
            `}
        >
            <div className="flex items-center space-x-1">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {paper.title || "Untitled Paper"}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {paper.authors?.join(", ") || "Unknown author"}
                    </span>
                </div>
            </div>
        </div>
    );
};

const PapersList: React.FC<{
    papers: Paper[];
    selectedPaper: Paper | null;
    setSelectedPaper: (paper: Paper | null) => void;
}> = ({ papers, selectedPaper, setSelectedPaper }) => {
    if (!papers || papers.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-4">No papers found</div>;
    } else {
        return (
            <div className="flex flex-col space-y-2">
                {papers.map((paper) => (
                    <PaperBox
                        key={paper.id}
                        paper={paper}
                        isSelected={selectedPaper?.id === paper.id}
                        onClick={() => setSelectedPaper(paper)}
                    />
                ))}
            </div>
        );
    }
};

const SourcesPanel: React.FC = () => {
    const { projectId, papers, selectedPaper, setSelectedPaper, refreshPapers, openModal, closeModal } =
        useWorkbench();

    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Search for papers
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return papers;
        const q = searchQuery.toLowerCase();
        return papers.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.authors?.some((a) => a.toLowerCase().includes(q))
        );
    }, [papers, searchQuery]);

    // Upload function that calls the API endpoints
    const uploadPaper = async (payload: UploadedPaperPayload) => {
        setIsUploading(true);
        try {
            // Step 1: Get authentication token
            const { data: { session }, error: authErr } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) {
                throw new Error("Not authenticated");
            }

            // Step 2: Process PDF to extract metadata (optional)
            let extractedMetadata: any = {};
            try {
                const processFormData = new FormData();
                processFormData.append("file", payload.file);
                processFormData.append("project_id", projectId);
                processFormData.append("pages_spec", "1,2"); // First two pages for metadata extraction

                const processResponse = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/papers/process-pdf`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: processFormData,
                    }
                );

                if (processResponse.ok) {
                    const processResult = await processResponse.json();
                    extractedMetadata = processResult.metadata || {};
                }
            } catch (error) {
                console.warn("Failed to extract metadata, proceeding with manual data:", error);
            }

            // Step 3: Prepare final metadata (prefer user input over extracted data)
            const finalMetadata = {
                title: extractedMetadata.title || payload.title?.trim() || payload.file.name.replace('.pdf', ''),
                authors: payload.authors?.length ? payload.authors : (extractedMetadata.authors || []),
                abstract: extractedMetadata.abstract || null,
                year: null as number | null,
                month: null as number | null,
                day: null as number | null,
                doi: payload.doi?.trim() || extractedMetadata.doi || null,
                category: extractedMetadata.category || null,
            };

            // Handle publication date
            if (payload.publicationDate) {
                const dateParts = payload.publicationDate.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                finalMetadata.year = !isNaN(year) ? year : null;
                finalMetadata.month = !isNaN(month) ? month : null;
                finalMetadata.day = !isNaN(day) ? day : null;
            } else if (extractedMetadata.year) {
                finalMetadata.year = extractedMetadata.year;
                finalMetadata.month = extractedMetadata.month || null;
                finalMetadata.day = extractedMetadata.day || null;
            }

            // Step 4: Upload the PDF with metadata
            const uploadFormData = new FormData();
            uploadFormData.append("file", payload.file);
            uploadFormData.append("project_id", projectId);
            uploadFormData.append("paper_type", "source"); // Default to source type
            uploadFormData.append("metadata_json", JSON.stringify(finalMetadata));

            const uploadResponse = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/upload-pdf`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: uploadFormData,
                }
            );

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Failed to upload PDF: ${uploadResponse.status} – ${errorText}`);
            }

            // Step 5: Refresh the papers list
            await refreshPapers();
        } catch (error: any) {
            console.error("Error uploading paper:", error);
            alert(error.message || "Failed to upload paper");
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenUploadModal = () => {
        openModal(
            <Modal onClose={closeModal}>
                <UploadPaperModal
                    onClose={closeModal}
                    onSubmit={async (data) => {
                        await uploadPaper(data);
                        closeModal();
                    }}
                    isUploading={isUploading}
                />
            </Modal>
        );
    };

    return (
        <div className="flex flex-col space-y-3">
            <h1 className="text-lg font-semibold">Sources</h1>

            <UploadPaperButton onClick={handleOpenUploadModal} />

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <PapersList
                papers={filtered}
                selectedPaper={selectedPaper}
                setSelectedPaper={setSelectedPaper}
            />
        </div>
    );
};

export default SourcesPanel;
