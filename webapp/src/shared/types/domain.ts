export type LeftPaneView = "files" | "library";
export type CenterPaneView = "writing" | "reading";
export type RightPaneView = "synthesis" | "review";

export interface ProjectSummary {
  id: string;
  name: string;
}

export interface FileNode {
  id: string;
  name: string;
  depth: number;
  fileType: "folder" | "latex" | "pdf_source" | "asset";
}
