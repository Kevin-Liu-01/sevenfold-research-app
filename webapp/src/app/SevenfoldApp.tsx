import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
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
    <div className="bg-surface-base text-text-primary flex min-h-screen flex-col">
      <ProjectContextBar />
      <div className="grid flex-1 grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,360px)]">
        <section className="pane-surface">
          <LeftPane />
        </section>
        <section className="pane-surface">
          <CenterPane />
        </section>
        <section className="pane-surface">
          <RightPane />
        </section>
      </div>
    </div>
  )
}

