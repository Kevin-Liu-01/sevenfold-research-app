-- Composition chunks: stores text chunks with embeddings for semantic search over compositions

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS composition_chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id      UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content_hash        TEXT NOT NULL,  -- Hash of composition contents to detect changes
    chunk_text          TEXT NOT NULL,
    start_line          INTEGER NOT NULL,
    end_line            INTEGER NOT NULL,
    embedding           VECTOR(768),
    fts                 TSVECTOR,  -- Full-text search vector
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by composition
CREATE INDEX IF NOT EXISTS idx_composition_chunks_composition_id 
    ON composition_chunks(composition_id);

-- Index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_composition_chunks_project_id 
    ON composition_chunks(project_id);

-- Index for checking if composition needs rechunking
CREATE INDEX IF NOT EXISTS idx_composition_chunks_hash 
    ON composition_chunks(composition_id, content_hash);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_composition_chunks_embedding 
    ON composition_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Index for line number queries
CREATE INDEX IF NOT EXISTS idx_composition_chunks_lines 
    ON composition_chunks(composition_id, start_line, end_line);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_composition_chunks_fts 
    ON composition_chunks USING GIN(fts);

-- Trigger to automatically update fts column
CREATE OR REPLACE FUNCTION composition_chunks_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.fts = to_tsvector('english', NEW.chunk_text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER composition_chunks_fts_trigger
    BEFORE INSERT OR UPDATE OF chunk_text
    ON composition_chunks
    FOR EACH ROW
    EXECUTE FUNCTION composition_chunks_fts_update();
