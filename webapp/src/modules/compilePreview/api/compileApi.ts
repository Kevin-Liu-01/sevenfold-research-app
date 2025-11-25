import { fetchLatexWithAuth } from "@/shared/services/latexClient";

export const compileApi = {
  async compileProjectAsset(projectId: string, assetId: string): Promise<Blob> {
    const response = await fetchLatexWithAuth(`/compile/${projectId}/${assetId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return response.blob();
  },
};
