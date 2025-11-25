import { useAppStore } from "@/shared/state/appStore"
import { PaneToggleGroup } from "@/shared/components/ui/PaneToggleGroup"
import { EditorWorkspace } from "@/modules/editorWorkspace/EditorWorkspace"
import { CompilePreviewPanel } from "@/modules/compilePreview/CompilePreviewPanel"
import { PdfViewerPane } from "@/modules/pdfViewer/PdfViewerPane"

export const CenterPane = () => {
  const { centerPaneView, setCenterPaneView } = useAppStore()

  return (
    <div className="flex h-full flex-col p-2 overflow-hidden">
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
      <div className="mt-4 flex-1 min-h-0 overflow-hidden">
        {centerPaneView === 'writing' ? (
          <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
            <EditorWorkspace />
            <CompilePreviewPanel />
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            <PdfViewerPane />
          </div>
        )}
      </div>
    </div>
  )
}
