// components/workbench/SourcesPanel.tsx

import React, { useState, useMemo } from "react";
import type { Paper } from "../../../database.types";
import AddPaperModal from "./AddPaperModal";

interface SourcesPanelProps {
    sourcePapers: Paper[];
    candidatePapers: Paper[];
    selectedPaperId: string | null;
    onClickPaper: (paper: Paper) => void;
    refreshPapers: () => void;
}

interface UploadedPaperPayload {
    /* ... */
}

const TABS = [
    { key: "sources", label: "Source Papers", dataKey: "sourcePapers" },
    {
        key: "candidates",
        label: "Candidate Papers",
        dataKey: "candidatePapers",
    },
] as const;

const SourcesPanel: React.FC<SourcesPanelProps> = ({
    sourcePapers,
    candidatePapers,
    selectedPaperId,
    onClickPaper,
    refreshPapers,
}) => {
    const [activeTab, setActiveTab] =
        useState<(typeof TABS)[number]["key"]>("sources");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Choose the right list based on activeTab
    const allPapers = activeTab === "sources" ? sourcePapers : candidatePapers;

    // Filter once
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return allPapers;
        const q = searchQuery.toLowerCase();
        return allPapers.filter(
            (p) =>
                p.filename.toLowerCase().includes(q) ||
                p.authors?.some((a) => a.toLowerCase().includes(q)),
        );
    }, [allPapers, searchQuery]);

    // Upload stub
    const uploadPaper = async (payload: UploadedPaperPayload) => {
        setIsUploading(true);
        try {
            /* ... same as before ... */
            refreshPapers();
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}

            {/* Tabs */}
            <nav className="flex px-4 bg-white">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setSearchQuery("");
                        }}
                        className={`flex-1 py-2 text-center text-xs font-medium transition ${
                            activeTab === tab.key
                                ? "text-orange-600 border-b-2 border-orange-600"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Search */}
            <div className="sticky z-10 px-4 py-3 bg-gray-50">
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
                            <span className="material-icons text-base">
                                close
                            </span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-1 py-1 h-full rounded-md transition"
                    >
                        <span className="material-icons text-base">
                            {isUploading ? "cloud_upload" : "upload_file"}
                        </span>
                    </button>
                </div>
            </div>

            {/* List */}
            <ul className="flex-1 overflow-auto px-4 space-y-2">
                {filtered.map((paper) => {
                    const isSelected = paper.id === selectedPaperId;
                    return (
                        <li
                            key={paper.id}
                            onClick={() => onClickPaper(paper)}
                            className={`
                flex items-center justify-between p-3 bg-white rounded-md transition
                ${isSelected ? "bg-blue-50 border border-orange-500" : "border border-gray-200 hover:shadow-sm"}
                cursor-pointer
              `}
                        >
                            <div className="flex items-center space-x-2">
                                <span className="material-icons text-xl text-gray-500">
                                    picture_as_pdf
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                        {paper.filename}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {/* {paper.authors?.join(", ") ||
                                            "Unknown author"}{" "}
                                        •{" "} */}
                                        {new Date(
                                            paper.created_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <span className="material-icons text-gray-400">
                                chevron_right
                            </span>
                        </li>
                    );
                })}

                {filtered.length === 0 && (
                    <li className="text-center text-gray-500 py-8">
                        No {activeTab === "sources" ? "source" : "candidate"}{" "}
                        papers found.
                    </li>
                )}
            </ul>

            {/* Modal */}
            {showAddModal && (
                <AddPaperModal
                    onClose={() => setShowAddModal(false)}
                    onSubmit={async (data) => {
                        await uploadPaper(data);
                        setShowAddModal(false);
                    }}
                    isUploading={isUploading}
                />
            )}
        </div>
    );
};

export default SourcesPanel;
