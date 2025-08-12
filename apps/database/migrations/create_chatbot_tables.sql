-- Create chatbot tabs table
CREATE TABLE chatbot_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chatbot messages table
CREATE TABLE chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tab_id UUID NOT NULL REFERENCES chatbot_tabs(id) ON DELETE CASCADE,
    paper_ids TEXT[] DEFAULT '{}', -- Array of paper IDs being discussed
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- Can store token counts, model used, etc.
);

-- Create indexes for performance
CREATE INDEX idx_chatbot_tabs_project_id ON chatbot_tabs(project_id);
CREATE INDEX idx_chatbot_messages_tab_id ON chatbot_messages(tab_id);
CREATE INDEX idx_chatbot_messages_paper_ids ON chatbot_messages USING GIN(paper_ids);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE chatbot_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Policy for chatbot_tabs: Users can only access tabs from their projects
CREATE POLICY "Users can access their project chatbot tabs" ON chatbot_tabs
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Policy for chatbot_messages: Users can only access messages from their tabs
CREATE POLICY "Users can access their chatbot messages" ON chatbot_messages
    FOR ALL USING (
        tab_id IN (
            SELECT ct.id FROM chatbot_tabs ct
            JOIN projects p ON ct.project_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );