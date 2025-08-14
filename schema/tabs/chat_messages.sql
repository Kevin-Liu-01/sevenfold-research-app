-- Create chatbot messages table

CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convo_id    UUID NOT NULL REFERENCES chat_convos(id) ON DELETE CASCADE,
    role        chat_message_role NOT NULL,
    data        TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX chat_messages_convo_id_idx ON chat_messages(convo_id);
