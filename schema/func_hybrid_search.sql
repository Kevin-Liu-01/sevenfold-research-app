CREATE OR REPLACE FUNCTION hybrid_search(
    query_text        TEXT,
    query_embedding   VECTOR(768),
    context_embedding VECTOR(768),
    match_count       INT,
    lexical_weight    FLOAT = 1,
    semantic_weight   FLOAT = 1,
    context_weight    FLOAT = 1,
    rrf_k             INT   = 50,
    min_year          INT   = 2005
)
RETURNS SETOF library
LANGUAGE SQL
AS $$
WITH 
-- 2. Lexical search (FTS index)
lexical AS (
    SELECT id,
           ROW_NUMBER() OVER (
               ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC
           ) AS rank_ix
    FROM library
    WHERE fts @@ websearch_to_tsquery(query_text) AND "year" > min_year
    LIMIT LEAST(match_count, 30) * 2
),

-- 3. Semantic ANN search (full HNSW scan)
semantic AS (
    SELECT id, embedding,
           ROW_NUMBER() OVER (
               ORDER BY embedding <-> query_embedding
           ) AS rank_ix
    FROM library
    WHERE "year" > min_year
    ORDER BY embedding <-> query_embedding
    LIMIT LEAST(match_count, 30) * 5
),

-- 4. Context ANN search (on semantic results)
context AS (
    SELECT s.id,
           ROW_NUMBER() OVER (
               ORDER BY s.embedding <-> context_embedding
           ) AS rank_ix
    FROM semantic s
    LIMIT LEAST(match_count, 30) * 2
)

-- 5. Combine & rank (Reciprocal Rank Fusion)
SELECT lib.*
FROM lexical
FULL OUTER JOIN semantic
    ON lexical.id = semantic.id
FULL OUTER JOIN context
    ON COALESCE(lexical.id, semantic.id) = context.id
JOIN library lib
    ON lib.id = COALESCE(lexical.id, semantic.id, context.id)
ORDER BY
    COALESCE(1.0 / (rrf_k + lexical.rank_ix), 0.0) * lexical_weight +
    COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight +
    COALESCE(1.0 / (rrf_k + context.rank_ix), 0.0) * context_weight DESC
LIMIT LEAST(match_count, 30);
$$;
