import React, { useState, useMemo } from "react";

import { useWorkbench } from "../context/WorkbenchContext";
import type { Paper } from "../../database.types";

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
                        key={paper.paper_id}
                        paper={paper}
                        isSelected={selectedPaper?.paper_id === paper.paper_id}
                        onClick={() => setSelectedPaper(paper)}
                    />
                ))}
            </div>
        );
    }
};

const SourcesPanel: React.FC = () => {
    const { papers, selectedPaper, setSelectedPaper, refreshPapers, openModal, closeModal } =
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

    // Upload stub
    const uploadPaper = async (payload: UploadedPaperPayload) => {
        setIsUploading(true);
        try {
            /* ... same as before ... */
            await refreshPapers();
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
