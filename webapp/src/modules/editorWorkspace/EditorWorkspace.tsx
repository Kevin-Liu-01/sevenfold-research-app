import Editor from "@monaco-editor/react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { editorApi } from "@/modules/editorWorkspace/api/editorApi"
import { Button } from "@/shared/components/ui/button"
import { useAppStore } from "@/shared/state/appStore"

const isInlineLatex = (mimeType: string | undefined, name: string, isInline?: boolean) => {
  const mime = mimeType?.toLowerCase() ?? ""
  const lowerName = name.toLowerCase()
  const isTex = mime.includes("tex") || lowerName.endsWith(".tex")
  return isTex && isInline !== false
}

export const EditorWorkspace = () => {
  const { activeProjectId, activeFile } = useAppStore()
  const [fileId, setFileId] = useState<string | null>(null)
  const [fileName, setFileName] = useState("Select a file")
  const [content, setContent] = useState("")
  const [initialContent, setInitialContent] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<"idle" | "latex" | "image" | "binary" | "unsupported">("idle")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("Select a project to start writing")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const latexCapable = !!(
    activeFile &&
    isInlineLatex(activeFile.mimeType, activeFile.name, activeFile.isInline)
  )

  const hasUnsavedChanges = mode === "latex" && content !== initialContent

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
        console.log("Loaded file:", file)
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

  const handleSave = useCallback(async () => {
    if (!activeProjectId || !fileId || !hasUnsavedChanges || mode !== "latex") return
    setSaving(true)
    setStatus("Saving…")
    setErrorMessage(null)
    try {
      await editorApi.updateFileContent(activeProjectId, fileId, content)
      setInitialContent(content)
      setStatus("Saved just now")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save file"
      setErrorMessage(message)
      setStatus(message)
    } finally {
      setSaving(false)
    }
  }, [activeProjectId, content, fileId, hasUnsavedChanges, mode])

  const statusTone = useMemo(() => {
    if (errorMessage) return "text-red-600"
    if (saving) return "text-text-primary"
    if (hasUnsavedChanges) return "text-amber-600"
    return "text-text-secondary"
  }, [errorMessage, hasUnsavedChanges, saving])

  const renderBody = () => {
    if (!activeProjectId) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-secondary">
          Select a project to load its files.
        </div>
      )
    }

    if (!activeFile) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-secondary">
          Select a file from the File Tree to begin.
        </div>
      )
    }

    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          Loading file…
        </div>
      )
    }

    if (mode === "latex" && fileId) {
      return (
        <Editor
          language="latex"
          value={content}
          onChange={(value) => {
            setContent(value ?? "")
            setStatus("Unsaved changes")
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
          }}
          theme="vs-light"
          loading={
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">
              Booting Monaco…
            </div>
          }
          height="100%"
        />
      )
    }

    if (mode === "image" && previewUrl) {
      return (
        <div className="flex h-full items-center justify-center">
          <img
            src={previewUrl}
            alt={fileName}
            className="max-h-full max-w-full rounded border border-border-soft object-contain"
          />
        </div>
      )
    }

    if (mode === "binary" && previewUrl) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-text-secondary">
          <p>This file type is not previewable. Download to view it locally.</p>
          <Button asChild size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              Download File
            </a>
          </Button>
        </div>
      )
    }

    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-secondary">
        {mode === "unsupported"
          ? "Choose an inline .tex file or an image to preview it here."
          : "Select a LaTeX file to view its contents."}
      </div>
    )
  }

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
            Active File
          </p>
          <p className="text-base font-semibold text-text-primary">{fileName}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <p className={statusTone}>{status}</p>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving || mode !== "latex" || !fileId}
            className="px-3 py-1 text-xs"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>
      <div className="mt-4 flex-1 min-h-0 rounded-xl border border-border-soft bg-surface-panel">
        {renderBody()}
      </div>
    </section>
  )
}
