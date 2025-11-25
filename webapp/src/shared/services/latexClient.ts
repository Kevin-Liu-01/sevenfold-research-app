import { supabase } from "./supabaseClient";

const LATEX_API_BASE_URL = import.meta.env.VITE_LATEX_API_BASE_URL;

if (!LATEX_API_BASE_URL) {
  throw new Error(
    "VITE_LATEX_API_BASE_URL environment variable is required. Please set it in your .env file."
  );
}

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function fetchLatex(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(`${LATEX_API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (err instanceof TypeError) {
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("fetch")
      ) {
        throw new Error(
          `Network error: Unable to connect to LaTeX API at ${LATEX_API_BASE_URL}. Please ensure the LaTeX service is running and CORS is configured.`
        );
      }
    }
    throw err;
  }
}

export async function fetchLatexWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  return fetchLatex(endpoint, { ...options, headers });
}
