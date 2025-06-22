import { createContext } from "react";

export interface ResearchContextType {
  pdfUrl: string | null;
  setPdfUrl: (url: string) => void;
  summary: string;
  setSummary: (text: string) => void;
}

export const ResearchContext = createContext<ResearchContextType>({
  pdfUrl: null,
  setPdfUrl: () => {},
  summary: "",
  setSummary: () => {},
});
