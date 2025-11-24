import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAppStore } from "@/shared/state/appStore";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure pdfjs worker to match react-pdf's bundled version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfViewerPane = () => {
  const { selectedLibraryDocument } = useAppStore();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when document changes
  useEffect(() => {
    if (selectedLibraryDocument) {
      setError(null);
    }
  }, [selectedLibraryDocument?.id]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || "Failed to load PDF");
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const documentTitle = selectedLibraryDocument?.title || "No document selected";

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4 min-h-0 h-full">
      <header className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">PDF Viewer</p>
          <p className="text-base font-semibold text-text-primary">{documentTitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-primary">
          <button
            type="button"
            className="ghost-button"
            onClick={handleZoomOut}
            disabled={!selectedLibraryDocument}
          >
            -
          </button>
          <span className="font-medium">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="ghost-button"
            onClick={handleZoomIn}
            disabled={!selectedLibraryDocument}
          >
            +
          </button>
        </div>
      </header>
      <div className="mt-4 flex-1 rounded-xl border border-dashed border-border-soft bg-surface-panel overflow-y-auto min-h-0">
        {!selectedLibraryDocument ? (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            Select a document from the library to view it here.
          </div>
        ) : !selectedLibraryDocument.download_url ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">
            PDF download URL is not available. Please try selecting the document again.
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">
            Error loading PDF: {error}
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex flex-col items-center gap-4">
              <Document
                file={selectedLibraryDocument.download_url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8 text-sm text-text-secondary">
                    Loading PDF...
                  </div>
                }
                onLoadStart={() => {
                  setLoading(true);
                  setError(null);
                }}
              >
                {numPages &&
                  Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg mb-4"
                    />
                  ))}
              </Document>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

