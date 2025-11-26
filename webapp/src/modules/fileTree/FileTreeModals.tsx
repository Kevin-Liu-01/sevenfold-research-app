import { useState } from "react"

import { filesApi } from "@/modules/fileTree/api/filesApi"
import { UploadModeSelector } from "@/modules/fileTree/components/UploadModeSelector"
import { importDirectory } from "@/modules/fileTree/upload/directoryImport"
import { importZip } from "@/modules/fileTree/upload/zipImport"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Modal } from "@/shared/components/ui/modal"
import type { FileNode } from "@/shared/types/domain"

type FileTreeModalsProps = {
  activeProjectId: string
  showNewLatex: boolean
  showNewFolder: boolean
  showUpload: boolean
  showDelete: boolean
  pendingDeleteIds: string[]
  fileTree: FileNode[]
  deleting: boolean
  getDeleteNames: (ids: string[], tree: FileNode[]) => string[]
  onCloseNewLatex: () => void
  onCloseNewFolder: () => void
  onCloseUpload: () => void
  onCancelDelete: () => void
  onConfirmDelete: (ids: string[]) => void
  onAddNode: (node: FileNode) => void
  onRefreshTree: () => Promise<void>
  onError: (errorMessage: string) => void
}

export const FileTreeModals = ({
  activeProjectId,
  showNewLatex,
  showNewFolder,
  showUpload,
  showDelete,
  pendingDeleteIds,
  fileTree,
  deleting,
  getDeleteNames,
  onCloseNewLatex,
  onCloseNewFolder,
  onCloseUpload,
  onCancelDelete,
  onConfirmDelete,
  onAddNode,
  onRefreshTree,
  onError,
}: FileTreeModalsProps) => {
  const [newLatexName, setNewLatexName] = useState("main.tex")
  const [newFolderName, setNewFolderName] = useState("new-folder")
  const [uploadFileName, setUploadFileName] = useState("")
  const [uploadMode, setUploadMode] = useState<"single" | "zip" | "dir">("single")
  const [creatingLatex, setCreatingLatex] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileList, setSelectedFileList] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  const isLatexLike = (file: File | null) => {
    if (!file) return false
    const lowered = file.name.toLowerCase()
    return lowered.endsWith(".tex") || lowered.endsWith(".bib") || file.type === "text/x-tex"
  }

  const deleteNames = getDeleteNames(pendingDeleteIds, fileTree)

  const resetUploadState = () => {
    setSelectedFile(null)
    setSelectedFileList(null)
    setUploadFileName("")
    setUploadError(null)
    setUploadStatus("")
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
    setUploadStatus(uploadMode === "zip" ? "Unzipping…" : uploadMode === "dir" ? "Preparing files…" : "")

    try {
      const latexMode = isLatexLike(selectedFile)
      if (uploadMode === "zip") {
        if (!selectedFile) throw new Error("Select a .zip to upload")
        await importZip(selectedFile, {
          projectId: activeProjectId,
          onProgress: (status) => setUploadStatus(status),
        })
        await onRefreshTree().catch(() => {})
        handleCloseUploadModal()
        return
      }

      if (uploadMode === "dir") {
        if (!selectedFileList || selectedFileList.length === 0) {
          throw new Error("Select a directory to upload")
        }
        await importDirectory(selectedFileList, {
          projectId: activeProjectId,
          onProgress: (status) => setUploadStatus(status),
        })
        await onRefreshTree().catch(() => {})
        handleCloseUploadModal()
        return
      }

      const result = await filesApi.createFile(activeProjectId, {
        parentId: null,
        name: selectedFile.name,
        assetType: "file",
        mimeType: latexMode ? "text/x-tex" : selectedFile.type || "application/octet-stream",
        isInline: latexMode ? true : false,
        content: latexMode ? await selectedFile.text() : undefined,
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

      if (!latexMode && result.uploadUrl) {
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
      setUploadStatus("")
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
        <div className="flex gap-4 text-sm">
          <UploadModeSelector value={uploadMode} onChange={setUploadMode} disabled={uploading} />
          <div className="flex flex-1 flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary">Select {uploadMode === "zip" ? ".zip" : "file"}</span>
              <input
                type="file"
                accept={uploadMode === "zip" ? ".zip" : undefined}
                multiple={uploadMode === "dir"}
                // @ts-ignore: webkitdirectory is not in the TS defs
                webkitdirectory={uploadMode === "dir"}
                onChange={(e) => {
                  const files = e.target.files
                  const file = files?.[0] ?? null
                  setSelectedFile(file)
                  setSelectedFileList(files)
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
              {uploadMode === "single"
                ? "Uploads create metadata, stream the binary to storage, then finalize."
                : uploadMode === "zip"
                  ? "Upload an Overleaf .zip to import your project."
                  : "Upload a folder to import its contents."}
            </p>
            {uploadStatus ? <p className="text-xs text-text-secondary">{uploadStatus}</p> : null}
            {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={showDelete}
        onClose={onCancelDelete}
        title="Delete files?"
        description="This will remove the selected items and their children."
        footer={
          <>
            <Button variant="ghost" onClick={onCancelDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onConfirmDelete(pendingDeleteIds)}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        {deleteNames.length ? (
          <ul className="list-disc space-y-1 pl-5 text-text-primary">
            {deleteNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary">Are you sure you want to delete the selected items?</p>
        )}
      </Modal>
    </>
  )
}
