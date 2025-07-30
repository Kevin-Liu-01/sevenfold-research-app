CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding VECTOR(768),
    match_count INT,
    lexical_weight FLOAT = 1,
    semantic_weight FLOAT = 1,
    rrf_k INT = 50
)
RETURNS SETOF corpus
LANGUAGE SQL
AS $$
WITH 
lexical AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC) AS rank_ix
    FROM
        corpus
    WHERE
        fts @@ websearch_to_tsquery(query_text)
    ORDER BY
        rank_ix
    LIMIT
        LEAST(match_count, 30) * 2
),
semantic AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY embedding <-> query_embedding) AS rank_ix
    FROM
        corpus
    ORDER BY
        rank_ix
    LIMIT
        LEAST(match_count, 30) * 2
)
SELECT
    corpus.*
FROM
    lexical
    FULL OUTER JOIN semantic
        ON lexical.id = semantic.id
    JOIN corpus
        ON COALESCE(lexical.id, semantic.id) = corpus.id
ORDER BY
    COALESCE(1.0 / (rrf_k + lexical.rank_ix), 0.0) * lexical_weight +
    COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight DESC
LIMIT
    LEAST(match_count, 30);
$$;
