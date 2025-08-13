-- Private corpus: links to paper_attr; uploader-scoped

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS priv_corpus (
    paper_id        UUID PRIMARY KEY REFERENCES paper_attrs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    embedding       VECTOR(768),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
