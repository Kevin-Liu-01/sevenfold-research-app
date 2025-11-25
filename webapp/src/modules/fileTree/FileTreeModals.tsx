import { useState } from "react"

import { filesApi } from "@/modules/fileTree/api/filesApi"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Modal } from "@/shared/components/ui/modal"
import type { FileNode } from "@/shared/types/domain"

type FileTreeModalsProps = {
  activeProjectId: string
  showNewLatex: boolean
  showNewFolder: boolean
  showUpload: boolean
  onCloseNewLatex: () => void
  onCloseNewFolder: () => void
  onCloseUpload: () => void
  onAddNode: (node: FileNode) => void
  onRefreshTree: () => Promise<void>
  onError: (errorMessage: string) => void
}

export const FileTreeModals = ({
  activeProjectId,
  showNewLatex,
  showNewFolder,
  showUpload,
  onCloseNewLatex,
  onCloseNewFolder,
  onCloseUpload,
  onAddNode,
  onRefreshTree,
  onError,
}: FileTreeModalsProps) => {
  const [newLatexName, setNewLatexName] = useState("main.tex")
  const [newFolderName, setNewFolderName] = useState("new-folder")
  const [uploadFileName, setUploadFileName] = useState("")
  const [creatingLatex, setCreatingLatex] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const resetUploadState = () => {
    setSelectedFile(null)
    setUploadFileName("")
    setUploadError(null)
  }

  const handleCloseUploadModal = () => {
    resetUploadState()
    onCloseUpload()
  }

  const handleUploadConfirm = async () => {
    if (!activeProjectId) return
    if (!selectedFile) {
      setUploadError("Select a file to upload")
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const result = await filesApi.createFile(activeProjectId, {
        parentId: null,
        name: selectedFile.name,
        assetType: "file",
        mimeType: selectedFile.type || "application/octet-stream",
        isInline: false,
      })

      const meta = result.fileMetadata
      const node: FileNode = {
        id: meta.id,
        name: meta.name,
        assetType: meta.assetType,
        mimeType: meta.mimeType,
        isInline: meta.isInline,
        parentId: meta.parentId,
        downloadUrl: meta.downloadUrl,
        uploadStatus: meta.uploadStatus,
        children: [],
      }

      onAddNode(node)

      if (result.uploadUrl) {
        try {
          await filesApi.uploadToSignedUrl(result.uploadUrl, selectedFile)
          await filesApi.finalizeUpload(activeProjectId, meta.id, "done")
        } catch (uploadErr) {
          await filesApi.finalizeUpload(activeProjectId, meta.id, "failed").catch(() => {})
          throw uploadErr instanceof Error
            ? uploadErr
            : new Error("Failed to upload file")
        }
      }

      await onRefreshTree().catch(() => {})
      handleCloseUploadModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload file"
      setUploadError(message)
      onError(message)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateLatex = async () => {
    if (!activeProjectId) return
    try {
      setCreatingLatex(true)
      const result = await filesApi.createFile(activeProjectId, {
        parentId: null,
        name: newLatexName,
        assetType: "file",
        mimeType: "text/x-tex",
        isInline: true,
      })

      const meta = result.fileMetadata
      const node: FileNode = {
        id: meta.id,
        name: meta.name,
        assetType: meta.assetType,
        mimeType: meta.mimeType,
        isInline: meta.isInline,
        parentId: meta.parentId,
        downloadUrl: meta.downloadUrl,
        uploadStatus: meta.uploadStatus,
        children: [],
      }

      onAddNode(node)
      onCloseNewLatex()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create file")
    } finally {
      setCreatingLatex(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!activeProjectId) return
    try {
      setCreatingFolder(true)
      const result = await filesApi.createFile(activeProjectId, {
        parentId: null,
        name: newFolderName,
        assetType: "folder",
        mimeType: "inode/directory",
        isInline: false,
      })

      const meta = result.fileMetadata
      const node: FileNode = {
        id: meta.id,
        name: meta.name,
        assetType: meta.assetType,
        mimeType: meta.mimeType,
        isInline: meta.isInline,
        parentId: meta.parentId,
        downloadUrl: meta.downloadUrl,
        uploadStatus: meta.uploadStatus,
        children: [],
      }

      onAddNode(node)
      onCloseNewFolder()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create folder")
    } finally {
      setCreatingFolder(false)
    }
  }

  return (
    <>
      <Modal
        open={showNewLatex}
        onClose={onCloseNewLatex}
        title="Create LaTeX file"
        description="Name your new .tex file and choose the parent folder once tree selection is wired."
        footer={
          <>
            <Button variant="ghost" onClick={onCloseNewLatex}>
              Cancel
            </Button>
            <Button onClick={handleCreateLatex} disabled={!newLatexName || !activeProjectId || creatingLatex}>
              {creatingLatex ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">File name</span>
          <Input
            value={newLatexName}
            onChange={(e) => setNewLatexName(e.target.value)}
            placeholder="main.tex"
          />
        </label>
        <p className="mt-3 text-xs text-text-secondary">
          File will be created inline; upload flow will be used for non-inline assets.
        </p>
      </Modal>

      <Modal
        open={showNewFolder}
        onClose={onCloseNewFolder}
        title="Create folder"
        description="Pick a name for the new folder. Parent selection will come from the tree."
        footer={
          <>
            <Button variant="ghost" onClick={onCloseNewFolder}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName || !activeProjectId || creatingFolder}
            >
              {creatingFolder ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Folder name</span>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="chapters"
          />
        </label>
      </Modal>

      <Modal
        open={showUpload}
        onClose={handleCloseUploadModal}
        title="Upload file"
        description="Create metadata and stream the file via the presigned upload URL."
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseUploadModal} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadConfirm}
              disabled={!selectedFile || !activeProjectId || uploading}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-text-secondary">Select file</span>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setSelectedFile(file)
                setUploadFileName(file?.name ?? "")
                setUploadError(null)
              }}
              className="text-sm"
              disabled={uploading}
            />
            {uploadFileName ? (
              <span className="text-xs text-text-secondary">Chosen: {uploadFileName}</span>
            ) : null}
          </label>
          <p className="text-xs text-text-secondary">
            Uploads create pending metadata, stream the binary to Supabase Storage, then finalize
            the status.
          </p>
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
        </div>
      </Modal>
    </>
  )
}
