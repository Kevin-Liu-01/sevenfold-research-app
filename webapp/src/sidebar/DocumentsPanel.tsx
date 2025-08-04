// components/workbench/DocumentsPanel.tsx

import React, { useState, useMemo } from "react";

interface DocumentItem {
    id: string;
    title: string;
}

interface DocumentsPanelProps {
    documents: DocumentItem[];
    selectedDocId: string | null;
    onClickDocument: (doc: DocumentItem) => void;
    onCreateDocument: () => void;
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({
    documents,
    selectedDocId,
    onClickDocument,
    onCreateDocument,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter((d) => d.title.toLowerCase().includes(q));
    }, [documents, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Search */}
            <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-2 relative text-gray-400">
                    <span className="material-icons text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search documents…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 text-xs text-gray-800 placeholder-gray-400 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-icons text-xs">
                                close
                            </span>
                        </button>
                    )}
                    <button
                        onClick={onCreateDocument}
                        aria-label="Add document"
                        className="inline-flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white text-xs pl-1 pr-2 py-1 rounded"
                    >
                        <span className="material-icons text-sm">add</span>
                        <span>Create</span>
                    </button>
                </div>
            </div>

            {/* Document List */}
            <ul className="flex-1 overflow-auto px-3 pt-1 space-y-2">
                {filtered.length === 0 ? (
                    <li className="text-center text-gray-500 py-6 text-xs">
                        No documents found.
                    </li>
                ) : (
                    filtered.map((doc) => {
                        const isSelected = doc.id === selectedDocId;
                        return (
                            <li
                                key={doc.id}
                                onClick={() => onClickDocument(doc)}
                                className={`flex items-center space-x-2 px-3 py-2 border border-gray-200 p-3 bg-white rounded-md cursor-pointer text-xs
                  ${
                      isSelected
                          ? "bg-orange-50 text-orange-800 border-l-4 border-orange-600"
                          : "hover:bg-gray-100 text-gray-800"
                  }`}
                            >
                                <span className="material-icons text-gray-500 text-sm">
                                    description
                                </span>
                                <span className="truncate">{doc.title}</span>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
};

export default DocumentsPanel;
