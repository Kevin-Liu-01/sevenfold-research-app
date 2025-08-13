-- projects: project level settings (FK auth.users) 

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION projects_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION projects_set_updated_at();

-- RLS: owner-only access for now (future memberships can extend this)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select_owner ON projects;
CREATE POLICY projects_select_owner
ON projects FOR SELECT
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS projects_insert_owner ON projects;
CREATE POLICY projects_insert_owner
ON projects FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS projects_update_owner ON projects;
CREATE POLICY projects_update_owner
ON projects FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS projects_delete_owner ON projects;
CREATE POLICY projects_delete_owner
ON projects FOR DELETE
USING (owner_id = auth.uid());
