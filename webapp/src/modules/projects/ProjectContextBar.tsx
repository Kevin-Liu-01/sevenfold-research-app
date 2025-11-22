import { useMemo } from "react"
import { useAppStore } from "@/shared/state/appStore"

export const ProjectContextBar = () => {
  const { projects, activeProjectId } = useAppStore()

  const activeProjectName = useMemo(
    () => projects.find((project) => project.id === activeProjectId)?.name ?? "Untitled Project",
    [projects, activeProjectId],
  )

  return (
    <header className="flex items-center justify-between border-b border-border-soft bg-surface-panel px-4 py-2 text-text-primary">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow">
          SF
        </div>
        <p className="text-base font-semibold">{activeProjectName}</p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="ghost-button">
          Feedback
        </button>
        <button
          type="button"
          aria-label="User menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface-contrast text-xs font-semibold text-text-primary"
        >
          U
        </button>
      </div>
    </header>
  )
}
