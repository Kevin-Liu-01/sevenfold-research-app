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
  assetType: "folder" | "file";
  mimeType?: string;
  isInline?: boolean;
  content?: string;
  parentId?: string | null;
  downloadUrl?: string | null;
  children?: FileNode[];
}
