# Supabase Schema

You can connect to the Ketspen primary database in Supabase via cli (note you must have `psql` installed):

```sh
psql -h db.rivimoqvqpbypjxfpfhl.supabase.co -p 5432 -d postgres -U postgres
```

Keywords:
- PK = Primary Key
- FK = Foreign Key

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
```

## paper_attrs

**Purpose**  
Canonical metadata for any paper (public or private). Other corpus tables reference this via `id`.

**Columns**  
- `id` (UUID, PK, default `gen_random_uuid()`)  
- `title` (TEXT, NOT NULL)  
- `abstract` (TEXT)  
- `authors` (TEXT[])  
- `year` (INT), `month` (INT), `day` (INT)  
- `doi` (TEXT)  
- `category` (TEXT)  
- `pdf_uri` (TEXT) — storage URI/path to the PDF  
- `created_at` (TIMESTAMPTZ, default `NOW()`)

**Example Usage**

```sql
INSERT INTO paper_attrs (title, abstract, authors, year, doi, category, pdf_uri)
VALUES (
    'A Survey of Vision Transformers',
    'We review…',
    ARRAY['Doe, J.', 'Smith, A.'],
    2024,
    '10.1234/vit.2024.001',
    'cs.CV',
    'publ-corpus/pdfs/1234.pdf'
)
RETURNING id;
```

### publ_corpus

**Purpose**  
Public corpus created from Ketspen indexing. Link a public paper (in `paper_attrs`) to search fields used for retrieval (FTS + embeddings).

**Columns**  
- `paper_id` — UUID, PK, FK → `paper_attrs.id`  
- `search_text` — TEXT; source text used to build FTS (e.g., title || abstract || authors)  
- `embedding` — VECTOR(768); semantic vector for ANN search  
- `fts` — TSVECTOR (generated from `search_text`)  
- `source` - TEXT; where this paper was indexed from
- `source_id` - TEXT; the id of this paper from its source
- `created_at` — TIMESTAMPTZ

**Indexes**  
- `publ_corpus_fts_idx` — GIN on `fts`  
- `publ_corpus_embedding_hnsw_l2` — HNSW on `embedding` (L2)

### priv_corpus

**Purpose**  
Private user papers obtained from uploading. Link a user-uploaded paper (in `paper_attrs`) to its owner and optional embedding. Not included in public search.

**Columns**  
- `paper_id` — UUID, PK, FK → `paper_attrs.id`  
- `user_id` — UUID, FK → `auth.users.id` (uploader/owner)  
- `embedding` — VECTOR(768); optional semantic vector for private retrieval  
- `created_at` — TIMESTAMPTZ

