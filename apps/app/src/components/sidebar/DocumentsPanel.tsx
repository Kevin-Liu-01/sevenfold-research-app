import React, { useState, useRef, useEffect } from "react";

type DocumentItem = { id: string; title: string };

interface DocumentsPanelProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onClickDocument: (doc: DocumentItem) => void;
  onCreateDocument: (title: string) => void;
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({
  documents,
  selectedDocId,
  onClickDocument,
  //   onCreateDocument,
}) => {
  //   const [newTitle, setNewTitle] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  //   useEffect(() => {
  //     const handleClickOutside = (event: MouseEvent) => {

  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => document.removeEventListener("mousedown", handleClickOutside);
  //   }, []);

  //   const handleCreate = () => {
  //     if (newTitle.trim()) {
  //       onCreateDocument(newTitle.trim());
  //       setNewTitle("");
  //     }
  //   };

  return (
    <div
      className="relative flex-1 overflow-auto p-3 space-y-4"
      ref={containerRef}
    >
      <div className="flex items-center justify-between mb-2 relative">
        <h4 className="text-sm font-semibold text-gray-800">Documents</h4>
        <button
          //   onClick={() => handleCreate())}
          className="p-1 rounded hover:bg-gray-100 focus:outline-none"
          title="Add document"
        >
          <span className="material-icons text-gray-600 text-base">add</span>
        </button>
      </div>

      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            onClick={() => onClickDocument(doc)}
            className={[
              "flex items-center text-xs cursor-pointer bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-gray-300 transition",
              selectedDocId === doc.id ? "border-indigo-500 bg-indigo-50" : "",
            ].join(" ")}
          >
            <span className="material-icons-outlined mr-2 text-gray-500 text-sm">
              description
            </span>
            <span className="font-medium text-gray-800 text-sm">
              {doc.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentsPanel;
