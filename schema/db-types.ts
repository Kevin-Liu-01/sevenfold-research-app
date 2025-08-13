// Ketspen DB Types (TypeScript)
// Mirrors Postgres tables: user_profiles, projects, paper_attrs, publ_corpus, priv_corpus
// Column names kept in snake_case to match DB rows.

export type UUID = string;

/** Vector embedding (pgvector 768-dim) */
export type Vector768 = number[]; // length 768 expected

/** ---------- user_profiles ---------- */
export interface UserProfile {
    user_id: UUID;
    first_name: string;
    last_name: string;
    pfp_path?: string | null;
    institution?: string | null;
    settings?: Record<string, unknown> | null;
    created_at: string;   // ISO timestamp
    updated_at: string;   // ISO timestamp
}

/** ---------- projects ---------- */
export interface ProjectsRow {
    id: UUID;
    owner_id: UUID;
    name: string;
    description: string | null;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface ProjectsInsert {
    id?: UUID;
    owner_id: UUID;
    name: string;
    description?: string | null;
    settings?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectsUpdate {
    owner_id?: UUID;
    name?: string;
    description?: string | null;
    settings?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

/** ---------- paper_attrs ---------- */
export interface PaperAttrsRow {
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

export interface PaperAttrsInsert {
    id?: UUID;
    title: string;
    abstract?: string | null;
    authors?: string[] | null;
    year?: number | null;
    month?: number | null;
    day?: number | null;
    doi?: string | null;
    category?: string | null;
    pdf_uri?: string | null;
    created_at?: string;
}

export interface PaperAttrsUpdate {
    title?: string;
    abstract?: string | null;
    authors?: string[] | null;
    year?: number | null;
    month?: number | null;
    day?: number | null;
    doi?: string | null;
    category?: string | null;
    pdf_uri?: string | null;
    created_at?: string;
}

/** ---------- publ_corpus ---------- */
export interface PublCorpusRow {
    paper_id: UUID;                 // PK, FK → paper_attrs.id
    search_text: string | null;
    embedding: Vector768 | null;
    fts: string | null;             // TSVECTOR (exposed as text if selected)
    source: string | null;
    source_id: string | null;
    created_at: string;
}

export interface PublCorpusInsert {
    paper_id: UUID;
    search_text?: string | null;
    embedding?: Vector768 | null;
    source?: string | null;
    source_id?: string | null;
    created_at?: string;
}

export interface PublCorpusUpdate {
    search_text?: string | null;
    embedding?: Vector768 | null;
    source?: string | null;
    source_id?: string | null;
    created_at?: string;
}

/** ---------- priv_corpus ---------- */
export interface PrivCorpusRow {
    paper_id: UUID;                 // PK, FK → paper_attrs.id
    user_id: UUID;                  // FK → auth.users.id
    embedding: Vector768 | null;
    created_at: string;
}

export interface PrivCorpusInsert {
    paper_id: UUID;
    user_id: UUID;
    embedding?: Vector768 | null;
    created_at?: string;
}

export interface PrivCorpusUpdate {
    user_id?: UUID;
    embedding?: Vector768 | null;
    created_at?: string;
}
