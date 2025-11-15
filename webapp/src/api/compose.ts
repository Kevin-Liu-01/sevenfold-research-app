import { getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch a composition record by id with auth headers included.
export const fetchComposition = async (compositionId: string) => {
    const session = await getAuthSession();
    const res = await fetch(`${API_BASE_URL}/compose/${compositionId}`, {
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch composition ${compositionId}`);
    }

    return res.json();
};

interface UpdateCompositionPayload {
    contents?: string;
    title?: string;
    type?: "docx" | "latex" | "markdown";
}

// Persist a composition’s contents/title/mode to the backend.
export const updateComposition = async (compositionId: string, payload: UpdateCompositionPayload) => {
    const session = await getAuthSession();
    const res = await fetch(`${API_BASE_URL}/compose/update/${compositionId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`Failed to update composition ${compositionId}`);
    }

    return res;
};

interface CreateCompositionPayload {
    project_id: string | null;
    type: "docx" | "latex" | "markdown";
    title: string;
    contents: string;
}

// Create a new composition for a project with default content.
export const createComposition = async (payload: CreateCompositionPayload) => {
    const session = await getAuthSession();
    const res = await fetch(`${API_BASE_URL}/compose/new_composition`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create composition: ${res.status} – ${text}`);
    }

    return res.json();
};
