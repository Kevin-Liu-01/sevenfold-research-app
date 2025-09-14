-- Public corpus: links to paper_attr; public-only search fields

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS publ_corpus (
    paper_id        UUID PRIMARY KEY REFERENCES paper_attrs(id) ON DELETE CASCADE,
    search_text     TEXT, -- Title + authors
    abstract_text   TEXT,
    year            INT,
    embedding       VECTOR(768),
    fts             TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', unaccent(coalesce(search_text,   ''))), 'A') ||
        setweight(to_tsvector('english', unaccent(coalesce(abstract_text, ''))), 'C')
    ) STORED,
    source          TEXT,
    source_id       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publ_corpus_fts_idx
    ON publ_corpus USING GIN (fts);

CREATE INDEX IF NOT EXISTS publ_corpus_embedding_hnsw_l2
    ON publ_corpus USING HNSW (embedding vector_l2_ops);
