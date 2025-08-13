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
