/// <reference types="vite/client" />

declare module '@pdftron/pdfjs-express' {
  interface WebViewerInstance {
    Core: {
      documentViewer: {
        addEventListener: (event: string, callback: (...args: any[]) => void) => void;
        getPageCount: () => number;
        getCurrentPage: () => number;
      };
      annotationManager: {
        importAnnotations: (xfdf: string) => Promise<void>;
        exportAnnotations: () => Promise<string>;
        addEventListener: (event: string, callback: (...args: any[]) => void) => void;
      };
    };
    UI: {
      loadDocument: (url: string, options: { filename: string }) => void;
      setHeaderItems: (callback: (header: any) => void) => void;
      disableElements: (elements: string[]) => void;
      setZoomStepFactors: (factors: { step: number; startZoom: number }[]) => void;
      setCurrentPage: (pageNumber: number) => void;
    };
    dispose: () => void;
  }

  interface WebViewer {
    (options: { path: string; licenseKey: string }, element: HTMLElement): Promise<WebViewerInstance>;
    Instance: WebViewerInstance; // Expose the instance type
  }

  const WebViewer: WebViewer;
  export default WebViewer;
}
