import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { LeftPane } from "@/app/panes/LeftPane"
import { CenterPane } from "@/app/panes/CenterPane"
import { RightPane } from "@/app/panes/RightPane"
import { ProjectContextBar } from "@/modules/projects/ProjectContextBar"
import { projectsApi } from "@/modules/projects/api/projectsApi"
import { useAppStore } from "@/shared/state/appStore"

type PanelHandle = {
  collapse: () => void
  expand: () => void
}

export const SevenfoldApp = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { setActiveProjectId, setProjects, projects } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const leftPanelRef = useRef<PanelHandle | null>(null)
  const rightPanelRef = useRef<PanelHandle | null>(null)

  useEffect(() => {
    if (!projectId) return

    const loadProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const project = await projectsApi.getProject(projectId)

        // Update projects list if not already present
        const existingProject = projects.find((p) => p.id === project.id)
        if (!existingProject) {
          setProjects([...projects, project])
        }

        setActiveProjectId(project.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, setActiveProjectId, setProjects, projects])

  useEffect(() => {
    const ref = leftPanelRef.current
    if (!ref) return
    if (isLeftCollapsed) {
      ref.collapse()
    } else {
      ref.expand()
    }
  }, [isLeftCollapsed])

  useEffect(() => {
    const ref = rightPanelRef.current
    if (!ref) return
    if (isRightCollapsed) {
      ref.collapse()
    } else {
      ref.expand()
    }
  }, [isRightCollapsed])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-text-muted">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-surface-base text-text-primary flex h-screen flex-col overflow-hidden">
      <ProjectContextBar />
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <Panel
          ref={leftPanelRef}
          defaultSize={15}
          minSize={10}
          maxSize={25}
          collapsible
          collapsedSize={0}
          className="pane-surface p-0"
        >
          <LeftPane />
        </Panel>
        <PanelResizeHandle className="group relative w-[6px] bg-border-soft hover:bg-border-medium transition-colors cursor-col-resize">
          <button
            type="button"
            aria-label={isLeftCollapsed ? "Expand left pane" : "Collapse left pane"}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsLeftCollapsed((prev) => !prev)
            }}
            className="absolute inset-x-0 top-1/2 z-10 flex h-12 w-full -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-surface-panel text-[10px] text-text-secondary shadow hover:bg-surface-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isLeftCollapsed ? "›" : "‹"}
          </button>
        </PanelResizeHandle>
        <Panel minSize={40} className="pane-surface">
          <CenterPane />
        </Panel>
        <PanelResizeHandle className="group relative w-[6px] bg-border-soft hover:bg-border-medium transition-colors cursor-col-resize">
          <button
            type="button"
            aria-label={isRightCollapsed ? "Expand right pane" : "Collapse right pane"}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsRightCollapsed((prev) => !prev)
            }}
            className="absolute inset-x-0 top-1/2 z-10 flex h-12 w-full -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-surface-panel text-[10px] text-text-secondary shadow hover:bg-surface-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isRightCollapsed ? "‹" : "›"}
          </button>
        </PanelResizeHandle>
        <Panel
          ref={rightPanelRef}
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={0}
          className="pane-surface"
        >
          <RightPane />
        </Panel>
      </PanelGroup>
    </div>
  )
}
