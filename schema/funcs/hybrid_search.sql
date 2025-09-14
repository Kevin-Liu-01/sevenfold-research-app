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
RETURNS SETOF paper_attrs
LANGUAGE SQL
AS $$
WITH 

-- 1. Lexical search (FTS index)
lexical AS (
    SELECT paper_id,
           ROW_NUMBER() OVER (
               ORDER BY ts_rank(
                   ARRAY[0.1, 0.2, 0.4, 1.0]::real[],  -- [D,C,B,A] → A (title+authors) dominates C (abstract)
                   fts,
                   websearch_to_tsquery('english', query_text)
               ) DESC
           ) AS rank_ix
    FROM publ_corpus
    WHERE "year" >= min_year
      AND fts @@ websearch_to_tsquery('english', query_text)
    LIMIT LEAST(match_count, 30) * 2
),

-- 2. Semantic ANN search
semantic AS (
    SELECT paper_id, embedding,
           ROW_NUMBER() OVER (
               ORDER BY embedding <-> query_embedding
           ) AS rank_ix
    FROM publ_corpus
    WHERE "year" >= min_year
    ORDER BY embedding <-> query_embedding
    LIMIT LEAST(match_count, 30) * 5
),

-- 3. Context ANN search
context AS (
    SELECT s.paper_id,
           ROW_NUMBER() OVER (
               ORDER BY s.embedding <-> context_embedding
           ) AS rank_ix
    FROM semantic s
    LIMIT LEAST(match_count, 30) * 2
)

-- 4. Combine & rank (RRF) and join to paper_attrs
SELECT pa.*
FROM lexical
FULL OUTER JOIN semantic
    ON lexical.paper_id = semantic.paper_id
FULL OUTER JOIN context
    ON COALESCE(lexical.paper_id, semantic.paper_id) = context.paper_id
JOIN publ_corpus pc
    ON pc.paper_id = COALESCE(lexical.paper_id, semantic.paper_id, context.paper_id)
JOIN paper_attrs pa
    ON pa.id = pc.paper_id
ORDER BY
    COALESCE(1.0 / (rrf_k + lexical.rank_ix), 0.0) * lexical_weight +
    COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight +
    COALESCE(1.0 / (rrf_k + context.rank_ix), 0.0) * context_weight DESC
LIMIT LEAST(match_count, 30);
$$;
