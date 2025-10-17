/// <reference types="vite/client" />

declare module '@pdftron/pdfjs-express' {
  type HeaderItem = unknown;

  interface HeaderGroup {
    delete: (id: string) => void;
    getItems: () => HeaderItem[];
    update: (items: HeaderItem[]) => void;
  }

  interface Header {
    getHeader: (id: string) => HeaderGroup;
  }

  interface WebViewerInstance {
    Core: {
      documentViewer: {
        addEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
        getPageCount: () => number;
        getCurrentPage: () => number;
      };
      annotationManager: {
        importAnnotations: (xfdf: string) => Promise<void>;
        exportAnnotations: () => Promise<string>;
        addEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
      };
    };
    UI: {
      loadDocument: (url: string, options: { filename: string }) => void;
      setHeaderItems: (callback: (header: Header) => void) => void;
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
