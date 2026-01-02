# arXiv Harvester

Modular OAI-PMH harvester for arXiv. Fetches records page-by-page, maps them to Pydantic models, generates embeddings, and upserts to Supabase with resumable state.

## Modules

- `main.py`: Orchestrator entrypoint. Controls resume state, paging loop, mapping, embedding, upload, and metrics.
- `cli.py`: CLI flags and parsing (`--from`, `--until`, `--set`, `--metadata-prefix`, `--sleep`, `--max-retries`, `--timeout`, `--resume`, `--state`, `--max-records`, also `--out`/`--gzip` for compatibility).
- `oai_client.py`: HTTP client with retry/backoff and XML parsing (`iter_records`). Uses `constants.py`.
- `mapping.py`: Transforms parsed record dicts into Pydantic models: `to_paper_attr_row`, `build_publ_row`.
- `state.py`: Load/save JSON state file with resume token and run metadata.
- `constants.py`: OAI endpoint and user agent.
- `arxiv_embedder.py`: Helper to embed `PublCorpusRow.search_text` in-place using the core embedder.

Models used:
- `db/paper_attr_row.py`: `PaperAttrRow` (paper attributes row).
- `db/publ_corpus_row.py`: `PublCorpusRow` (search corpus row).

## Run

Run via module entrypoint:

```bash
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

Notes:
- `--out` and `--gzip` are retained for CLI compatibility, but no local output is produced. The state path defaults to `<out>.state.json` unless `--state` is provided.
- `--resume` refuses to resume if parameters differ from the saved state.
- `--max-records` is helpful for smoke tests.

## State File

JSON with fields:
- `resumption_token`
- `total_written`
- `from`, `until`, `set`, `metadata_prefix`
- `last_saved` (UTC ISO8601 string)

## Environment

Set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`

## File List

```
source_arxiv/
├── README.md
├── arxiv_embedder.py
├── cli.py
├── constants.py
├── main.py
├── mapping.py
├── oai_client.py
└── state.py
```

