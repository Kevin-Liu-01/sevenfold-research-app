import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectsApi } from "./api/projectsApi";
import { useAppStore } from "@/shared/state/appStore";
import { Button } from "@/shared/components/ui/button";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function ProjectsPage() {
  const { projects, setProjects } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.listProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [setProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-text-muted">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-base text-text-primary flex min-h-screen flex-col">
      <header className="border-b border-border-soft bg-surface-panel px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent text-white flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow">
              SF
            </div>
            <h1 className="text-xl font-semibold">My Projects</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create New Project
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-text-muted">No projects yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="border-border-soft bg-surface-panel hover:bg-surface-contrast rounded-lg border p-6 text-left transition-colors"
              >
                <h3 className="mb-2 text-lg font-semibold">{project.name}</h3>
                <p className="text-text-muted text-sm">Click to open</p>
              </button>
            ))}
          </div>
        )}
      </main>

      {showCreateDialog && (
        <CreateProjectDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={loadProjects}
        />
      )}
    </div>
  );
}

