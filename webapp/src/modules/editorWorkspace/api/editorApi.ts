import { fetchWithAuth } from "@/shared/services/apiClient"

type FileMetadataResponse = {
  id: string
  name: string
  mime_type?: string
  is_inline?: boolean
  content?: string | null
  download_url?: string | null
}

export type EditorFile = {
  id: string
  name: string
  mimeType?: string
  isInline: boolean
  content: string
  downloadUrl: string | null
}

export const editorApi = {
  async fetchActiveFile(projectId: string, fileId: string): Promise<EditorFile> {
    const response = await fetchWithAuth(`/api/projects/${projectId}/files/${fileId}`)
    const metadata: FileMetadataResponse = await response.json()

    const isInline = metadata.is_inline !== false
    const downloadUrl = metadata.download_url ?? null

    if (!isInline && !downloadUrl) {
      throw new Error("Download URL missing for non-inline file")
    }

    return {
      id: metadata.id,
      name: metadata.name,
      mimeType: metadata.mime_type,
      isInline,
      content: isInline ? metadata.content ?? "" : "",
      downloadUrl,
    }
  },

  async updateFileContent(projectId: string, fileId: string, content: string): Promise<void> {
    await fetchWithAuth(`/api/projects/${projectId}/files/${fileId}/content`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    })
  },
}
