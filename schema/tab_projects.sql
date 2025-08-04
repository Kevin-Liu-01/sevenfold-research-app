CREATE TABLE projects (
    project_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    research_desc text,
    keywords text[],
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamp DEFAULT now(),
    editor_content text

    library_ids uuid[] DEFAULT '{}',
    user_papers_ids uuid[] DEFAULT '{}',
);