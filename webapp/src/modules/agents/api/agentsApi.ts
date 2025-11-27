import { fetchWithAuth } from "@/shared/services/apiClient";

export interface SynthesisRequest {
  project_id: string;
  query: string;
  target_pdf_id?: string;
}

/**
 * Stream RAG synthesis responses from the backend.
 * Returns a ReadableStream of text chunks.
 */
export async function streamSynthesis(
  request: SynthesisRequest
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetchWithAuth("/api/agents/synthesis", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!response.body) {
    throw new Error("Response body is null");
  }

  return response.body;
}
