from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import NAMESPACE_URL, UUID, uuid5

from core.config import EMBEDDER_EMBEDDING_DIM
from orm.paper_attr_row import PaperAttrRow
from orm.publ_corpus_row import PublCorpusRow


def _safe_parse_date(s: Optional[str]) -> datetime:
    if not s:
        raise ValueError("Expected date string, got empty or None")
    # Handle trailing 'Z'
    if s.endswith("Z"):
        s = s[:-1]
    # Some arXiv dates are 'YYYY-MM-DD' or include time
    try:
        return datetime.fromisoformat(s)
    except Exception as e:
        raise ValueError(f"Unparseable date string: {s}") from e


def to_paper_attr_row(rec: Dict) -> PaperAttrRow:
    """Map a harvested non-deleted arXiv record dict to PaperAttrRow.

    Raises ValueError if required fields are missing or invalid.
    """
    if rec.get("deleted"):
        raise ValueError("Deleted record passed to _to_paper_attr_row")

    arxiv_id = rec.get("id")
    if not arxiv_id or not str(arxiv_id).strip():
        raise ValueError("Missing arXiv id in record")

    # created preferred; fallback to updated, but must exist and be parseable
    created_raw = rec.get("created")
    updated_raw = rec.get("updated")
    created_dt: Optional[datetime] = None
    if created_raw:
        created_dt = _safe_parse_date(created_raw)
    elif updated_raw:
        created_dt = _safe_parse_date(updated_raw)
    else:
        raise ValueError("Record missing both created and updated timestamps")

    # Choose category: prefer explicit primary tag, else the first category term
    primary_tag = rec.get("primary_category")
    categories: List[str] = rec.get("categories") or []
    category = primary_tag or (categories[0] if categories else None)

    # Authors as list of display names; require at least one non-empty
    authors = rec.get("authors")
    if not isinstance(authors, list) or len(authors) == 0:
        raise ValueError("Missing authors list")
    author_names: List[str] = []
    for au in authors:
        if isinstance(au, dict):
            name = au.get("name")
            if not name or not str(name).strip():
                # attempt to build from parts; still require non-empty
                name = f"{(au.get('forenames') or '').strip()} {(au.get('keyname') or '').strip()}".strip()
        else:
            name = str(au).strip()
        if name:
            author_names.append(name)
    if not author_names:
        raise ValueError("Parsed authors list is empty")

    title = rec.get("title")
    if not title or not str(title).strip():
        raise ValueError("Missing or empty title")
    abstract = rec.get("abstract")
    if not abstract or not str(abstract).strip():
        raise ValueError("Missing or empty abstract")

    # Deterministic UUID based on arXiv id to prevent duplicates
    paper_uuid: UUID = uuid5(NAMESPACE_URL, f"arxiv:{arxiv_id}")

    return PaperAttrRow(
        id=paper_uuid,
        title=str(title),
        abstract=str(abstract),
        authors=author_names,
        year=created_dt.year,
        month=created_dt.month,
        day=created_dt.day,
        doi=rec.get("doi"),
        category=category,
        pdf_uri=f"https://arxiv.org/pdf/{arxiv_id}.pdf",
        created_at=datetime.now(timezone.utc),  # Set to current time on insertion
    )


def build_publ_row(row: PaperAttrRow, rec: Dict) -> PublCorpusRow:
    search_text = f"{row.title}—{'; '.join(row.authors)}".strip()
    return PublCorpusRow(
        paper_id=row.id,
        search_text=search_text,
        abstract_text=row.abstract,
        embedding=[0.0] * EMBEDDER_EMBEDDING_DIM,
        source="arxiv",
        source_id=str(rec.get("id")),
        year=row.year,
        created_at=row.created_at,  # Set to current time on insertion
    )

