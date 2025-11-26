import CodeMirror from "@uiw/react-codemirror"
import { latex } from "codemirror-lang-latex"
import { EditorView } from "@codemirror/view"
import { useCallback, useMemo, useState } from "react"

import { editorApi } from "@/modules/editorWorkspace/api/editorApi"
import { useEditorFile } from "@/modules/editorWorkspace/hooks/useEditorFile"
import { useAutoSave } from "@/modules/editorWorkspace/hooks/useAutoSave"
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
  const latexCapable =
    !!activeFile && isInlineLatex(activeFile.mimeType, activeFile.name, activeFile.isInline)

  const {
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
  } = useEditorFile(activeProjectId, activeFile, latexCapable)

  const [saving, setSaving] = useState(false)

  const hasUnsavedChanges = mode === "latex" && content !== initialContent

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

  useAutoSave(handleSave, hasUnsavedChanges, [content])

  const statusTone = useMemo(() => {
    if (errorMessage) return "text-red-600"
    if (saving) return "text-text-primary"
    if (hasUnsavedChanges) return "text-amber-600"
    return "text-text-secondary"
  }, [errorMessage, hasUnsavedChanges, saving])

  const editorExtensions = useMemo(
    () => [
      latex({
        enableLinting: false,
        enableAutocomplete: true,
        autoCloseTags: true,
        autoCloseBrackets: false,
      }),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "14px",
        },
      }),
    ],
    [],
  )

  const renderBody = () => {
    if (!activeProjectId) {
      return (
        <div className="flex h-full w-full flex-1 items-center justify-center px-4 text-center text-sm text-text-secondary">
          Select a project to load its files.
        </div>
      )
    }

    if (!activeFile) {
      return (
        <div className="flex h-full w-full flex-1 items-center justify-center px-4 text-center text-sm text-text-secondary">
          Select a file from the File Tree to begin.
        </div>
      )
    }

    if (loading) {
      return (
        <div className="flex h-full w-full flex-1 items-center justify-center text-sm text-text-secondary">
          Loading file…
        </div>
      )
    }

    if (mode === "latex" && fileId) {
      return (
        <div className="flex h-full w-full flex-1">
          <CodeMirror
            value={content}
            basicSetup={{closeBrackets: false}}
            extensions={editorExtensions}
            height="100%"
            style={{ height: "100%", width: "100%" }}
            onChange={(value) => {
              setContent(value)
              setStatus("Unsaved changes")
            }}
          />
        </div>
      )
    }

    if (mode === "image" && previewUrl) {
      return (
        <div className="flex h-full w-full flex-1 items-center justify-center">
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
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-sm text-text-secondary">
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
      <div className="flex h-full w-full flex-1 items-center justify-center px-4 text-center text-sm text-text-secondary">
        {mode === "unsupported"
          ? "Choose an inline .tex file or an image to preview it here."
          : "Select a LaTeX file to view its contents."}
      </div>
    )
  }

  return (
    <section className="flex min-h-[85vh] flex-shrink-0 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4 overflow-hidden">
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
      <div className="mt-4 flex-1 min-h-0 rounded-xl border border-border-soft bg-surface-panel p-4 text-sm text-text-primary flex">
        {renderBody()}
      </div>
    </section>
  )
}
