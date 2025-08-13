# Supabase Schema

PK = Primary Key
FK = Foreign Key

## user_profiles

**Purpose**  
Stores per-user profile data and preferences linked to `auth.users.id`. Each auth user has at most one profile.

**Columns**  
- `user_id` (UUID, PK, FK → auth.users.id) — identity key, cascades on delete.  
- `first_name` (TEXT, NOT NULL) — user's given name.  
- `last_name` (TEXT, NOT NULL) — user's surname/family name.  
- `pfp_path` (TEXT) — path or URL to profile picture (optional).  
- `institution` (TEXT) — institution or affiliation (optional).  
- `settings` (JSONB) — user preferences, defaults to `{}`.  
- `created_at` / `updated_at` (TIMESTAMPTZ) — timestamps; `updated_at` auto-maintained by trigger.

**Security (RLS)**  
- Enabled.  
- Policies allow a user to **SELECT / INSERT / UPDATE only their own row** using `auth.uid()`.  
- Supabase service role bypasses RLS automatically.

**Example usage**
```sql
-- Create or update your own profile
INSERT INTO user_profiles (user_id, first_name, last_name, pfp_path, institution)
VALUES (auth.uid(), 'Calico', 'Cat', '/pfps/calico-cat.png', 'Princeton University')
ON CONFLICT (user_id) DO UPDATE
SET first_name  = EXCLUDED.first_name,
    last_name   = EXCLUDED.last_name,
    pfp_path    = EXCLUDED.pfp_path,
    institution = EXCLUDED.institution;

-- Read your profile
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

## projects

**Purpose**  
Project container owned by a single user **today**. Uses `owner_id` so you can add multi-user memberships later without breaking schema.

**Columns**  
- `id` (UUID, PK)  
- `owner_id` (UUID, FK → `auth.users.id`) — current owner; future collaborators can be added via a membership table  
- `name` (TEXT, NOT NULL)  
- `description` (TEXT)  
- `settings` (JSONB, default `{}`)  
- `created_at` / `updated_at` (TIMESTAMPTZ) — `updated_at` maintained by trigger

**Indexes**  
- `idx_projects_owner` on (`owner_id`) for fast "my projects" queries.

**Security (RLS)**  
- Enabled.  
- Policies allow the **owner** to `SELECT / INSERT / UPDATE / DELETE`.  
- When adding multi-user support later, introduce `project_memberships` and broaden policies to check membership.

**Example usage**
```sql
-- Create a project you own
INSERT INTO projects (owner_id, name, description)
VALUES (auth.uid(), 'Lit Review', 'Vision Transformers');

-- Read your project(s)
SELECT * FROM projects WHERE owner_id = auth.uid();

-- Update your project
UPDATE projects SET name = 'Lit Review (ViT)' WHERE owner_id = auth.uid();

-- Delete your project
DELETE FROM projects WHERE owner_id = auth.uid();

