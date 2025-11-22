import { FileTreePanel } from "@/modules/fileExplorer/FileTreePanel"
import { LibraryPanel } from "@/modules/library/LibraryPanel"
import { useAppStore } from "@/shared/state/appStore"
import { PaneToggleGroup } from "@/shared/components/ui/PaneToggleGroup"

export const LeftPane = () => {
  const { leftPaneView, setLeftPaneView } = useAppStore()

  let panelContent
  if (leftPaneView === "files") {
    panelContent = <FileTreePanel />
  } else {
    panelContent = <LibraryPanel />
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PaneToggleGroup
        value={leftPaneView}
        onChange={setLeftPaneView}
        options={[
          { label: "Files", value: "files" },
          { label: "Library", value: "library" },
        ]}
        density="compact"
        fullWidth
      />
      <div className="flex-1 overflow-hidden rounded-sm border border-border-soft bg-surface-contrast">
        {panelContent}
      </div>
    </div>
  )
}

