-- Junction table linking projects to papers
-- Stores whether a paper is part of a project and any related annotations

CREATE TABLE IF NOT EXISTS project_paper_links (
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    paper_id        UUID NOT NULL REFERENCES paper_attrs(id) ON DELETE CASCADE,
    has_paper       BOOLEAN NOT NULL DEFAULT TRUE,
    annotations     XML,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, paper_id)
);

-- Index to quickly find all papers for a project
CREATE INDEX IF NOT EXISTS idx_project_paper_links_project_id
    ON project_paper_links(project_id);

-- Index to quickly find all projects containing a given paper
CREATE INDEX IF NOT EXISTS idx_project_paper_links_paper_id
    ON project_paper_links(paper_id);
