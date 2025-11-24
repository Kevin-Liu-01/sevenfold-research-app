import { useAppStore } from "@/shared/state/appStore"
import { PaneToggleGroup } from "@/shared/components/ui/PaneToggleGroup"
import { EditorWorkspace } from "@/modules/editorWorkspace/EditorWorkspace"
import { CompilePreviewPanel } from "@/modules/compilePreview/CompilePreviewPanel"
import { PdfViewerPane } from "@/modules/pdfViewer/PdfViewerPane"

export const CenterPane = () => {
  const { centerPaneView, setCenterPaneView } = useAppStore()

  return (
    <div className="flex h-full flex-col gap-4 p-2">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-[0.2em]">
          Authoring
        </p>
        <PaneToggleGroup
          value={centerPaneView}
          onChange={setCenterPaneView}
          options={[
            { label: 'Writing', value: 'writing' },
            { label: 'Reading', value: 'reading' },
          ]}
        />
      </div>
      {centerPaneView === 'writing' ? (
        <div className="flex flex-1 flex-col gap-4">
          <EditorWorkspace />
          <CompilePreviewPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden min-h-0">
          <PdfViewerPane />
        </div>
      )}
    </div>
  )
}