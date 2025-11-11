-- Paper chunks: stores text chunks with embeddings for semantic search over papers

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS paper_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES paper_attrs(id) ON DELETE CASCADE,
    chunk_text      TEXT NOT NULL,
    start_line      INTEGER NOT NULL,
    end_line        INTEGER NOT NULL,
    embedding       VECTOR(768),
    fts             TSVECTOR,  -- Full-text search vector
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by paper
CREATE INDEX IF NOT EXISTS idx_paper_chunks_paper_id 
    ON paper_chunks(paper_id);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_paper_chunks_embedding 
    ON paper_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index for line number queries
CREATE INDEX IF NOT EXISTS idx_paper_chunks_lines 
    ON paper_chunks(paper_id, start_line, end_line);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_paper_chunks_fts 
    ON paper_chunks USING GIN(fts);

-- Trigger to automatically update fts column
CREATE OR REPLACE FUNCTION paper_chunks_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.fts = to_tsvector('english', NEW.chunk_text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER paper_chunks_fts_trigger
    BEFORE INSERT OR UPDATE OF chunk_text
    ON paper_chunks
    FOR EACH ROW
    EXECUTE FUNCTION paper_chunks_fts_update();
