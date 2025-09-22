-- paper_attrs: Base paper attributes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS paper_attrs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    abstract        TEXT,
    authors         TEXT[],
    year            INT,
    month           INT,
    day             INT,
    doi             TEXT,
    category        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);