// components/workbench/SourcesPanel.tsx

import React from "react";
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
}) => (
  <div className="relative flex-1 overflow-auto p-3 space-y-4">
    {sourcePapers.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          Source Papers
        </h4>
        <ul className="space-y-2">
          {sourcePapers.map((paper) => (
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

    {candidatePapers.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          Candidate Papers
        </h4>
        <ul className="space-y-2">
          {candidatePapers.map((paper) => (
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
  </div>
);

export default SourcesPanel;
