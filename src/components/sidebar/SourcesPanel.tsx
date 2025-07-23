// components/workbench/SourcesPanel.tsx

import React, { useState, useMemo } from "react";
import type { Paper } from "../../../database.types";

interface SourcesPanelProps {
  sourcePapers: Paper[];
  candidatePapers: Paper[];
  selectedPaperId: string | null;
  onClickPaper: (paper: Paper) => void;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sourcePapers,
  candidatePapers,
  selectedPaperId,
  onClickPaper,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter papers based on search query
  const filteredSourcePapers = useMemo(() => {
    if (!searchQuery.trim()) return sourcePapers;
    
    const query = searchQuery.toLowerCase();
    return sourcePapers.filter(paper => 
      paper.filename.toLowerCase().includes(query)
    );
  }, [sourcePapers, searchQuery]);

  const filteredCandidatePapers = useMemo(() => {
    if (!searchQuery.trim()) return candidatePapers;
    
    const query = searchQuery.toLowerCase();
    return candidatePapers.filter(paper => 
      paper.filename.toLowerCase().includes(query)
    );
  }, [candidatePapers, searchQuery]);

  return (
    <div className="relative flex-1 overflow-auto p-3 space-y-4">
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
            Source Papers {searchQuery && `(${filteredSourcePapers.length}/${sourcePapers.length})`}
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
                {/* {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="material-icons text-[1.1rem] text-gray-400 hover:text-gray-600"
                    onClick={(e) => e.stopPropagation()}
                    title="Open paper in new tab"
                  >
                    link
                  </a>
                )} */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredCandidatePapers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Candidate Papers {searchQuery && `(${filteredCandidatePapers.length}/${candidatePapers.length})`}
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
                {/* {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="material-icons text-[1.1rem] text-gray-400 hover:text-gray-600"
                    onClick={(e) => e.stopPropagation()}
                    title="Open paper in new tab"
                  >
                    link
                  </a>
                )} */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show message when no papers match search */}
      {searchQuery && filteredSourcePapers.length === 0 && filteredCandidatePapers.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No papers found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SourcesPanel;
