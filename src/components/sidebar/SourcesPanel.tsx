// components/workbench/SourcesPanel.tsx
import React, { useState, useMemo } from "react";
import type { Paper } from "../../../database.types";
import AddPaperModal from "./AddPaperModal";

interface SourcesPanelProps {
  sourcePapers: Paper[];
  candidatePapers: Paper[];
  selectedPaperId: string | null;
  onClickPaper: (paper: Paper) => void;
  refreshPapers: () => void; // callback to reload papers after upload
}

interface UploadedPaperPayload {
  /** The PDF file to upload */
  file: File;
  /** Whether to enqueue indexing of this paper */
  addToIndex: boolean;
  /** Optional fallback title (will default to file.name if omitted) */
  title?: string;
  /** Optional list of authors */
  authors?: string[];
  /** Optional publication date in YYYY-MM-DD format */
  publicationDate?: string | null;
  /** Optional DOI string */
  doi?: string;
  /** Optional tags to attach */
  tags?: string[];
  /** Optional free‑form notes */
  notes?: string | null;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sourcePapers,
  candidatePapers,
  selectedPaperId,
  onClickPaper,
  refreshPapers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Filter papers based on search query
  const filteredSourcePapers = useMemo(() => {
    if (!searchQuery.trim()) return sourcePapers;
    const q = searchQuery.toLowerCase();
    return sourcePapers.filter((p) => p.filename.toLowerCase().includes(q));
  }, [sourcePapers, searchQuery]);

  const filteredCandidatePapers = useMemo(() => {
    if (!searchQuery.trim()) return candidatePapers;
    const q = searchQuery.toLowerCase();
    return candidatePapers.filter((p) => p.filename.toLowerCase().includes(q));
  }, [candidatePapers, searchQuery]);

  // Stub: replace with real API call
  const uploadPaper = async (payload: UploadedPaperPayload) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", payload.file);
      form.append("addToIndex", String(payload.addToIndex));
      if (payload.title) form.append("title", payload.title);
      if (payload.authors)
        payload.authors.forEach((a) => form.append("authors[]", a));
      if (payload.publicationDate)
        form.append("publicationDate", payload.publicationDate);
      if (payload.doi) form.append("doi", payload.doi);
      if (payload.tags) payload.tags.forEach((t) => form.append("tags[]", t));
      if (payload.notes) form.append("notes", payload.notes);

      await fetch(`/api/projects/{projectId}/papers/upload`, {
        method: "POST",
        body: form,
      });
      refreshPapers();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative flex-1 overflow-auto p-3 space-y-3">
        {/* Upload Paper Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-black text-sm text-white py-2 font-semibold rounded-md hover:bg-blue-700 transition"
        >
          + Upload Paper
        </button>

        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search papers by title or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredSourcePapers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Source Papers{" "}
              {searchQuery &&
                `(${filteredSourcePapers.length}/${sourcePapers.length})`}
            </h4>
            <ul className="space-y-2">
              {filteredSourcePapers.map((paper) => (
                <li
                  key={paper.id}
                  onClick={() => onClickPaper(paper)}
                  className={[
                    "flex justify-between items-center text-xs cursor-pointer bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-gray-300 transition",
                    selectedPaperId === paper.id
                      ? "border-blue-500 bg-blue-50"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{paper.filename}</span>
                    <span className="text-[0.65rem] text-gray-500">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filteredCandidatePapers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Candidate Papers{" "}
              {searchQuery &&
                `(${filteredCandidatePapers.length}/${candidatePapers.length})`}
            </h4>
            <ul className="space-y-2">
              {filteredCandidatePapers.map((paper) => (
                <li
                  key={paper.id}
                  onClick={() => onClickPaper(paper)}
                  className={[
                    "flex justify-between items-center text-xs cursor-pointer bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-gray-300 transition",
                    selectedPaperId === paper.id
                      ? "border-blue-500 bg-blue-50"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{paper.filename}</span>
                    <span className="text-[0.65rem] text-gray-500">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchQuery &&
          filteredSourcePapers.length === 0 &&
          filteredCandidatePapers.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No papers found matching "{searchQuery}"
            </div>
          )}

        {/* Add Paper Modal */}
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
    </>
  );
};

export default SourcesPanel;
