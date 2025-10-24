-- table storing compositions

-- Create enum for composition types
CREATE TYPE composition_type AS ENUM (
    'docx',
    'latex',
    'markdown'
);

CREATE TABLE IF NOT EXISTS compositions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type            composition_type NOT NULL,
    title           TEXT,
    contents        TEXT
);
