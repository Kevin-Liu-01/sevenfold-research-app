import { fetchWithAuth } from "@/shared/services/apiClient";
import type { LibraryDocument } from "@/shared/types/domain";

interface LibraryListResponse {
  project_id: string;
  documents: LibraryDocument[];
}

export const libraryApi = {
  async list(projectId: string): Promise<LibraryDocument[]> {
    const response = await fetchWithAuth(`/api/projects/${projectId}/library`);
    const data: LibraryListResponse = await response.json();
    return data.documents;
  },

  async upload(projectId: string, file: File): Promise<LibraryDocument> {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetchWithAuth(
      `/api/projects/${projectId}/upload-pdf`,
      {
        method: "POST",
        body: formData,
      }
    );

    return response.json();
  },

  async rename(
    projectId: string,
    documentId: string,
    title: string
  ): Promise<LibraryDocument> {
    const response = await fetchWithAuth(
      `/api/projects/${projectId}/library/${documentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }
    );
    return response.json();
  },

  async remove(projectId: string, documentId: string): Promise<void> {
    await fetchWithAuth(`/api/projects/${projectId}/library/${documentId}`, {
      method: "DELETE",
    });
  },
};
