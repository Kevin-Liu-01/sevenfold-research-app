# Ketspen Backend


Initialization

```
python -m venv venv
pip install -r requirements
```


Start the App

```
uvicorn main:app --reload --port 8080
```


## Supabase SQLEditors


Create Projects Table
```
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  research_question text NOT NULL,
  keywords text[] NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  editor_content text
);
```

Create Papers Table
```
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('source', 'candidate')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  annotations TEXT[]
);
```

```
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert papers for their own projects"
  ON papers FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view papers for their own projects"
  ON papers FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

```