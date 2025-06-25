import React, { useState } from "react";
import type { ReactNode } from "react";
import { ResearchContext } from "./ResearchContext";

export const ResearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  return (
    <ResearchContext.Provider
      value={{ pdfUrl, setPdfUrl, summary, setSummary }}
    >
      {children}
    </ResearchContext.Provider>
  );
};
