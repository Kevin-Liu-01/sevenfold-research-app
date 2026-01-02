# Indexer

Utilities to harvest arXiv metadata via OAI-PMH, generate SPECTER2 embeddings, and upsert records to Supabase. The harvester is modular and processes records page-by-page with resumable state.

## Quickstart

- Create and activate a virtualenv:
  - `python3 -m venv venv && source venv/bin/activate`
  - `pip install -r requirements.txt`
- Configure environment variables (Supabase keys, etc.)
- Run a source harvester (e.g., arXiv):
  - `python -m source_arxiv.main --from 2025-09-01 --until 2025-09-02 --max-records 100`

## Structure

- `db/`: Pydantic models for DB rows (`paper_attr_row.py`, `publ_corpus_row.py`).
- `indexer_core/supabase_client.py`: Batched upserts with retries; accepts lists of Pydantic models.
- `indexer_core/embedder.py`: SPECTER2 embedder (batching, model config via `core/config.py`).
- `indexer_core/metrics.py`: `MetricsTracker` for totals, per-record timing, elapsed time, throughput.

### File Tree

```
.
├── README.md
├── requirements.txt
├── set_env_vars.sh
├── orm/
│   ├── __init__.py
│   ├── paper_attr_row.py
│   └── publ_corpus_row.py
├── core/
│   ├── __init__.py
│   ├── api_clients.py
│   ├── config.py
│   ├── embedder.py
│   ├── metrics.py
│   ├── preprocessor.py
│   ├── supabase_client.py
│   └── utils.py
└── source_arxiv/
    ├── README.md
    ├── arxiv_embedder.py
    ├── cli.py
    ├── constants.py
    ├── main.py
    ├── mapping.py
    ├── oai_client.py
    └── state.py
```

## Running

Example full run:

```
python -m source_arxiv.main \
  --from 2025-09-01 \
  --until 2025-09-02 \
  --set cs \
  --metadata-prefix arXiv \
  --sleep 3 \
  --max-retries 5 \
  --timeout 60 \
  --resume \
  --state arxiv.json.state.json \
  --max-records 100
```

- `--resume` continues a previous run and refuses to resume if parameters differ from the saved state.
- State file fields: `resumption_token`, `total_written`, `from`, `until`, `set`, `metadata_prefix`, `last_saved` (UTC ISO8601).

## Embedding & Upload

- Embedding: `core/embedder.py` (SPECTER2) with batch size and model names from `core/config.py`.
- Uploads: `indexer_core/supabase_client.py` upserts in batches with retries and accepts lists of Pydantic BaseModel objects (converted via `model_dump(exclude_none=True, mode='json')`).
- Harvester builds `PaperAttrRow` and `PublCorpusRow` Pydantic objects and uploads them directly.

## Environment

Set via `set_env_vars.sh` (see `core/config.py` for names):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
- Optional: `ANTHROPIC_API_KEY` (used outside the harvester)

## Metrics

- `indexer_core/metrics.py` provides `MetricsTracker` to track totals, elapsed time, per-record duration, and throughput. The harvester logs summaries per page and on completion.

## Notes

- Python 3.10+ recommended.
- Use a small `--max-records` for smoke tests: `python -m source_arxiv.main --max-records 10 --resume`.
