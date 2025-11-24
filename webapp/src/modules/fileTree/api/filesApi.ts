import { fetchWithAuth } from "@/shared/services/apiClient";
import type { FileNode } from "@/shared/types/domain";

type RawFileNode = {
  id: string;
  name: string;
  asset_type: "folder" | "file";
  mime_type?: string;
  is_inline?: boolean;
  parent_id?: string | null;
  download_url?: string | null;
  children?: RawFileNode[];
};

export type CreateFileRequest = {
  parentId?: string | null;
  name: string;
  assetType: "folder" | "file";
  mimeType: string;
  isInline: boolean;
};

export type UpdateFileRequest = {
  newParentId?: string | null;
  newName?: string;
};

export type FileMetadata = Omit<FileNode, "children">;

export type CreateFileResult = {
  fileMetadata: FileMetadata;
  uploadUrl: string | null;
};

const mapRawNode = (node: RawFileNode): FileNode => ({
  id: node.id,
  name: node.name,
  assetType: node.asset_type,
  mimeType: node.mime_type,
  isInline: node.is_inline,
  parentId: node.parent_id ?? null,
  downloadUrl: node.download_url,
  children: node.children?.map(mapRawNode) ?? [],
});

const mapMetadata = (node: RawFileNode): FileMetadata => ({
  id: node.id,
  name: node.name,
  assetType: node.asset_type,
  mimeType: node.mime_type,
  isInline: node.is_inline,
  parentId: node.parent_id ?? null,
  downloadUrl: node.download_url,
});

export const filesApi = {
  async fetchTree(projectId: string): Promise<FileNode[]> {
    const response = await fetchWithAuth(`/api/projects/${projectId}/files`);
    const payload = await response.json();

    const tree: RawFileNode[] = payload?.file_tree ?? [];
    return tree.map(mapRawNode);
  },

  async createFile(projectId: string, payload: CreateFileRequest): Promise<CreateFileResult> {
    const response = await fetchWithAuth(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: JSON.stringify({
        parent_id: payload.parentId ?? null,
        name: payload.name,
        asset_type: payload.assetType,
        mime_type: payload.mimeType,
        is_inline: payload.isInline,
      }),
    });

    const body = await response.json();
    const rawMetadata: RawFileNode | undefined = body?.file_metadata;

    if (!rawMetadata) {
      throw new Error("Create file response missing file metadata");
    }

    return {
      fileMetadata: mapMetadata(rawMetadata),
      uploadUrl: body?.upload_url ?? null,
    };
  },

  async updateFileMetadata(
    projectId: string,
    fileId: string,
    payload: UpdateFileRequest,
  ): Promise<FileMetadata> {
    const response = await fetchWithAuth(`/api/projects/${projectId}/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({
        new_parent_id: payload.newParentId ?? null,
        new_name: payload.newName,
      }),
    });

    const rawMetadata: RawFileNode | undefined = await response.json();
    if (!rawMetadata) {
      throw new Error("Update file response missing file metadata");
    }
    return mapMetadata(rawMetadata);
  },

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    await fetchWithAuth(`/api/projects/${projectId}/files/${fileId}`, {
      method: "DELETE",
    });
  },
};
