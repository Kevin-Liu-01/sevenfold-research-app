-- Create chatbot conversations table

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS chat_convos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT   NOT NULL DEFAULT 'New Chat',
    paper_ids   TEXT[] DEFAULT '{}',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX chat_convos_project_id_idx ON chat_convos(project_id);
