-- Function to search composition chunks using hybrid search (vector + full-text)

CREATE OR REPLACE FUNCTION search_composition_chunks(
    query_embedding VECTOR(768),
    query_text TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_project_id UUID DEFAULT NULL,
    semantic_weight FLOAT DEFAULT 0.7  -- Weight for semantic vs lexical (0.7 = 70% semantic, 30% lexical)
)
RETURNS TABLE (
    id UUID,
    composition_id UUID,
    composition_title TEXT,
    chunk_text TEXT,
    start_line INT,
    end_line INT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.composition_id,
        COALESCE(c.title, 'Untitled') AS composition_title,
        cc.chunk_text,
        cc.start_line,
        cc.end_line,
        -- Hybrid score: weighted combination of semantic and lexical similarity
        CASE 
            WHEN query_text IS NOT NULL AND query_text != '' THEN
                (semantic_weight * (1 - (cc.embedding <=> query_embedding))) +
                ((1 - semantic_weight) * ts_rank(cc.fts, to_tsquery('english', query_text)))
            ELSE
                1 - (cc.embedding <=> query_embedding)
        END AS similarity
    FROM composition_chunks cc
    JOIN compositions c ON c.id = cc.composition_id
    WHERE
        (filter_project_id IS NULL OR cc.project_id = filter_project_id)
        AND (
            -- Either semantic similarity is above threshold
            (1 - (cc.embedding <=> query_embedding)) > match_threshold
            -- Or lexical match exists (if query_text provided)
            OR (query_text IS NOT NULL AND query_text != '' AND cc.fts @@ to_tsquery('english', query_text))
        )
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
