import { fetchWithAuth } from "@/shared/services/apiClient";
import type { ProjectSummary } from "@/shared/types/domain";

export const projectsApi = {
  async listProjects(): Promise<ProjectSummary[]> {
    const response = await fetchWithAuth("/api/projects");
    return response.json();
  },

  async getProject(projectId: string): Promise<ProjectSummary> {
    const response = await fetchWithAuth(`/api/projects/${projectId}`);
    return response.json();
  },

  async createProject(name: string): Promise<ProjectSummary> {
    const response = await fetchWithAuth("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return response.json();
  },
};
