import { useCallback, useEffect, useState } from "react"
import type { ActiveFile } from "@/shared/types/domain"
import { editorApi } from "@/modules/editorWorkspace/api/editorApi"

type Mode = "idle" | "latex" | "image" | "binary" | "unsupported"

export const useEditorFile = (
  activeProjectId: string,
  activeFile: ActiveFile | null,
  latexCapable: boolean,
) => {
  const [fileId, setFileId] = useState<string | null>(null)
  const [fileName, setFileName] = useState("Select a file")
  const [content, setContent] = useState("")
  const [initialContent, setInitialContent] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("idle")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("Select a project to start writing")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resetState = useCallback((message: string) => {
    setFileId(null)
    setContent("")
    setInitialContent("")
    setPreviewUrl(null)
    setMode("idle")
    setStatus(message)
  }, [])

  useEffect(() => {
    if (!activeProjectId) {
      resetState("Select a project to start writing")
      setFileName("Select a file")
      return
    }

    if (!activeFile) {
      resetState("Select a file from the tree to begin editing")
      setFileName("Select a file")
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setStatus("Loading file…")
      setErrorMessage(null)
      setPreviewUrl(null)
      setContent("")
      setInitialContent("")
      try {
        const file = await editorApi.fetchActiveFile(activeProjectId, activeFile.id)
        if (cancelled) return
        setFileId(file.id)
        setFileName(file.name)
        if (file.isInline && latexCapable) {
          setContent(file.content)
          setInitialContent(file.content)
          setMode("latex")
          setStatus("Loaded manuscript")
        } else if (!file.isInline && file.mimeType?.startsWith("image/") && file.downloadUrl) {
          setPreviewUrl(file.downloadUrl)
          setMode("image")
          setStatus("Image preview ready")
        } else if (!file.isInline && file.downloadUrl) {
          setPreviewUrl(file.downloadUrl)
          setMode("binary")
          setStatus("Download to view this file type")
        } else {
          setMode("unsupported")
          setStatus("File type not supported for preview")
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load file"
        setErrorMessage(message)
        setStatus(message)
        setMode("unsupported")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeProjectId, activeFile, latexCapable, resetState])

  return {
    fileId,
    fileName,
    content,
    setContent,
    initialContent,
    setInitialContent,
    previewUrl,
    mode,
    loading,
    status,
    setStatus,
    errorMessage,
    setErrorMessage,
  }
}
