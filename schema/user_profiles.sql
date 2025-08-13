-- user_profiles: per-user profile/settings (FK to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    pfp_path     TEXT,
    institution  TEXT,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION user_profiles_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION user_profiles_set_updated_at();

-- RLS: users can read/insert/update only their own row
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_own ON user_profiles;
CREATE POLICY user_profiles_select_own
ON user_profiles FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_insert_own ON user_profiles;
CREATE POLICY user_profiles_insert_own
ON user_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_update_own ON user_profiles;
CREATE POLICY user_profiles_update_own
ON user_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
