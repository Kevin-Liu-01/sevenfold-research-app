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
  uploadStatus?: "pending" | "done" | "failed";
  children?: FileNode[];
}

export interface ActiveFile {
  id: string;
  name: string;
  mimeType?: string;
  isInline?: boolean;
}

export interface EntryFile {
  id: string;
  name: string;
}

export interface LibraryDocument {
  id: string;
  project_id: string;
  title: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  content_type: string;
  index_status: string;
  index_error: string | null;
  created_at: string;
  download_url?: string | null;
}
