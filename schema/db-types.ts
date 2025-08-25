// Ketspen DB Types (TypeScript)
// Mirrors Postgres tables: user_profiles, projects, paper_attrs, publ_corpus, priv_corpus
// Column names kept in snake_case to match DB rows.

export type UUID = string;

/** Vector embedding (pgvector 768-dim) */
export type Vector768 = number[]; // length 768 expected

export interface UserProfile {
    user_id: UUID;
    first_name: string;
    last_name: string;
    pfp_path: string | null;
    institution: string | null;
    settings: Record<string, unknown> | null;
    created_at: string;   // ISO timestamp
    updated_at: string;   // ISO timestamp
}

export interface Project {
    id: UUID;
    owner_id: UUID;
    name: string;
    description: string | null;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Paper {
    id: UUID;
    title: string;
    abstract: string | null;
    authors: string[] | null;
    year: number | null;
    month: number | null;
    day: number | null;
    doi: string | null;
    category: string | null;
    pdf_uri: string | null;
    created_at: string;
}
export interface PublCorpusPaper {
    paper_id: UUID;                 // PK, FK → paper_attrs.id
    search_text: string | null;
    embedding: Vector768 | null;
    fts: string | null;             // TSVECTOR (exposed as text if selected)
    source: string | null;
    source_id: string | null;
    created_at: string;
}
export interface PrivCorpusPaper {
    paper_id: UUID;                 // PK, FK → paper_attrs.id
    user_id: UUID;                  // FK → auth.users.id
    embedding: Vector768 | null;
    created_at: string;
}


export interface ChatConvo {
    id: UUID;
    project_id: UUID;
    name: string;
    paper_ids: string[];
    created_at: string;
    updated_at: string;
    metadata: Record<string. unknown> | null;
}

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export interface ChatMessage {
    id: UUID;
    convo_id: UUID;
    role: ChatMessageRole;
    data: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
}
export interface Composition {
    id: UUID;
    project_id: UUID;               // FK → projects.id
    type: "latex" | "markdown";
    title: string | null;
    contents: string | null;

}

export interface UploadedPaperPayload {
    file: File;
    addToIndex: boolean;
    title?: string;
    authors?: string[];
    publicationDate?: string | null;
    doi?: string;
    tags?: string[];
    notes?: string | null;
}