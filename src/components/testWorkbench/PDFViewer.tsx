// src/components/testWorkbench/PDFViewer.tsx
import React, { useContext, useState, useEffect, useRef } from "react";
import { ResearchContext } from "../../context/ResearchContext";
import useLocalStorage from "../../hooks/useLocalStorage";

interface Annotation {
  text: string;
  page: number;
  selection: string;
}

// util: convert Blob to data URL
const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

const PDFViewer: React.FC = () => {
  const { pdfUrl } = useContext(ResearchContext);
  const key = `annotations_${pdfUrl || "none"}`;
  const [annotations, setAnnotations] = useLocalStorage<Annotation[]>(key, []);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectionText, setSelectionText] = useState("");
  const [selectionPage, setSelectionPage] = useState(1);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // fetch and convert PDF to data URL
  useEffect(() => {
    if (!pdfUrl) {
      setFileDataUrl(null);
      return;
    }
    (async () => {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      setFileDataUrl(dataUrl);
      // Optional: estimate pages by loading PDF metadata via PDF.js if needed
      // For now numPages remains unmanaged or you can hardcode a large value
    })();
  }, [pdfUrl]);

  // detect text highlight inside container (won't detect inside iframe)
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (sel?.toString().trim()) {
        setSelectionText(sel.toString());
        setSelectionPage(pageNumber);
        setModalOpen(true);
        sel.removeAllRanges();
      }
    };
    const el = containerRef.current;
    el?.addEventListener("mouseup", handleMouseUp);
    return () => el?.removeEventListener("mouseup", handleMouseUp);
  }, [pageNumber]);

  const saveAnnotation = () => {
    const note = noteRef.current?.value.trim();
    if (note) {
      setAnnotations([
        ...annotations,
        { text: note, page: selectionPage, selection: selectionText },
      ]);
    }
    setModalOpen(false);
    if (noteRef.current) noteRef.current.value = "";
  };

  if (!pdfUrl) {
    return (
      <div className="flex flex-col my-auto p-4 items-center justify-center text-gray-500 text-xs">
        <img
          src="/images/logo-bw.png"
          alt="ai assistant"
          className="w-12 h-12 opacity-50 object-cover rounded-full mr-1"
        />
        <p>Select a paper to view its PDF!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded shadow-sm text-xs">
      {/* Pagination controls */}
      <div className="flex-none bg-gray-100 p-1 flex items-center justify-center text-xs">
        <button
          onClick={() => setPageNumber((n) => Math.max(n - 1, 1))}
          disabled={pageNumber <= 1}
          className="px-1"
        >
          <i className="material-icons-outlined">chevron_left</i>
        </button>
        <span className="px-2">
          {pageNumber} {numPages ? `/ ${numPages}` : ""}
        </span>
        <button
          onClick={() =>
            setPageNumber((n) => (numPages ? Math.min(n + 1, numPages) : n + 1))
          }
          className="px-1"
        >
          <i className="material-icons-outlined">chevron_right</i>
        </button>
      </div>

      {/* PDF Render area via iframe */}
      <div ref={containerRef} className="flex-1 overflow-auto p-2">
        {/* {fileDataUrl ? ( */}
        {pdfUrl ? (
          <iframe
            // src={`${fileDataUrl}#page=${pageNumber}`}
            src={pdfUrl}
            title="PDF Viewer"
            className="w-full h-full border-none"
          />
        ) : (
          <div className="text-center text-gray-500 text-xs">Loading PDF…</div>
        )}
      </div>

      {/* Annotations list */}
      <div className="flex-none bg-gray-50 p-2 border-t text-xs">
        <div className="font-medium mb-1">Annotations</div>
        <ul className="space-y-1 max-h-24 overflow-auto">
          {annotations.length ? (
            annotations.map((a, i) => (
              <li key={i}>
                <span className="font-semibold">[Pg {a.page}]</span> "
                {a.selection}" — {a.text}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No annotations yet</li>
          )}
        </ul>
      </div>

      {/* Annotation modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 w-80 text-xs">
            <div className="font-semibold mb-1">
              New Annotation (Pg {selectionPage})
            </div>
            <div className="italic text-gray-600 mb-2 truncate">
              "{selectionText}"
            </div>
            <textarea
              ref={noteRef}
              className="w-full h-16 border p-1 text-xs mb-2"
              placeholder="Enter your note..."
            />
            <div className="flex justify-end space-x-1">
              <button
                onClick={() => setModalOpen(false)}
                className="px-2 py-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveAnnotation}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
