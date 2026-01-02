import argparse


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Harvest arXiv metadata via OAI-PMH")
    # Output is no longer written locally; keep --out only for deriving default state path if desired.
    p.add_argument("--out", required=False, default="arxiv.json", help="Deprecated: no local writes; used for default state path only.")
    # Gzip no longer applicable, retained for backward CLI compatibility (no effect).
    p.add_argument("--gzip", action="store_true", help="Deprecated: ignored (no local writes).")
    p.add_argument("--from", dest="from_date", default=None,
                   help="OAI 'from' (e.g., 2025-09-01 or 2025-09-01T00:00:00Z)")
    p.add_argument("--until", dest="until_date", default=None,
                   help="OAI 'until' (e.g., 2025-09-02 or 2025-09-02T00:00:00Z)")
    p.add_argument("--set", dest="set_spec", default=None,
                   help="OAI set (e.g., 'physics', 'cs', 'math', 'q-bio', 'q-fin', 'stat', 'eess', 'econ').")
    p.add_argument("--metadata-prefix", default="arXiv", help="OAI metadataPrefix (default: arXiv).")
    p.add_argument("--sleep", type=float, default=3.0, help="Seconds to sleep between requests (politeness).")
    p.add_argument("--max-retries", type=int, default=5, help="Max HTTP/XML retries per request.")
    p.add_argument("--timeout", type=float, default=60.0, help="HTTP timeout seconds.")
    p.add_argument("--resume", action="store_true", help="Resume from state file if present.")
    p.add_argument("--state", default=None, help="Path to state file (JSON). Defaults to <out>.state.json")
    p.add_argument("--max-records", type=int, default=None, help="Stop after N records (for testing).")
    return p.parse_args()
