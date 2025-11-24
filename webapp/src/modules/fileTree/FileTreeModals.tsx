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
  onError,
}: FileTreeModalsProps) => {
  const [newLatexName, setNewLatexName] = useState("main.tex")
  const [newFolderName, setNewFolderName] = useState("new-folder")
  const [uploadFileName, setUploadFileName] = useState("")
  const [creatingLatex, setCreatingLatex] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)

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
        onClose={onCloseUpload}
        title="Upload file"
        description="Upload PDFs or assets; we’ll show an upload URL and status once wired."
        footer={
          <>
            <Button variant="ghost" onClick={onCloseUpload}>
              Cancel
            </Button>
            <Button onClick={onCloseUpload}>Upload</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-text-secondary">Select file</span>
            <input
              type="file"
              onChange={(e) => setUploadFileName(e.target.files?.[0]?.name ?? "")}
              className="text-sm"
            />
            {uploadFileName ? (
              <span className="text-xs text-text-secondary">Chosen: {uploadFileName}</span>
            ) : null}
          </label>
          <p className="text-xs text-text-secondary">
            Folder selection and presigned upload handling will be wired to the API.
          </p>
        </div>
      </Modal>
    </>
  )
}
