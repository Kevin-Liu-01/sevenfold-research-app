import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { LeftPane } from "@/app/panes/LeftPane"
import { CenterPane } from "@/app/panes/CenterPane"
import { RightPane } from "@/app/panes/RightPane"
import { ProjectContextBar } from "@/modules/projects/ProjectContextBar"
import { projectsApi } from "@/modules/projects/api/projectsApi"
import { useAppStore } from "@/shared/state/appStore"

export const SevenfoldApp = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { setActiveProjectId, setProjects, projects } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <Panel defaultSize={15} minSize={10} maxSize={20} className="pane-surface">
          <LeftPane />
        </Panel>
        <PanelResizeHandle className="w-0.5 bg-border-soft hover:bg-border-medium transition-colors cursor-col-resize" />
        <Panel minSize={40} className="pane-surface overflow-hidden">
          <CenterPane />
        </Panel>
        <PanelResizeHandle className="w-0.5 bg-border-soft hover:bg-border-medium transition-colors cursor-col-resize" />
        <Panel defaultSize={20} minSize={15} maxSize={30} className="pane-surface">
          <RightPane />
        </Panel>
      </PanelGroup>
    </div>
  )
}

