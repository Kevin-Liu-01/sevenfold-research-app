import time
from typing import Dict, Iterable, Optional, Tuple

import requests
import xml.etree.ElementTree as ET

from .constants import ENDPOINT, USER_AGENT

_session: Optional[requests.Session] = None

def request_listrecords(params: Dict, timeout: float, max_retries: int) -> str:
    """Perform a single OAI-PMH request with basic retry/backoff."""
    global _session
    if _session is None:
        _session = requests.Session()
    session = _session
    session.headers.update({"User-Agent": USER_AGENT})
    backoff = 2.0
    last_exc = None
    for _ in range(1, max_retries + 1):
        try:
            print(f"Requesting OAI-PMH with params: {params}")
            r = session.get(ENDPOINT, params=params, timeout=timeout)
            if r.status_code == 200:
                print(f"Received {len(r.content)} bytes")
                return r.text
            # Retry on 5xx; backoff on 429 or similar
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(backoff)
                backoff = min(backoff * 1.5, 30.0)
                continue
            r.raise_for_status()
        except requests.RequestException as e:
            last_exc = e
            time.sleep(backoff)
            backoff = min(backoff * 1.5, 30.0)
    # If we’re here, failed all attempts
    if last_exc:
        raise last_exc
    raise RuntimeError("Unknown error during request_listrecords")


def iter_records(xml_text: str) -> Tuple[Iterable[Dict], Optional[str]]:
    """
    Parse OAI-PMH ListRecords XML and yield records as dictionaries.
    Returns (iterator, resumptionToken or None).
    """
    # Namespaces for OAI-PMH and arXiv format
    ns = {
        "oai": "http://www.openarchives.org/OAI/2.0/",
        "arxiv": "http://arxiv.org/OAI/arXiv/"
    }

    root = ET.fromstring(xml_text)

    # Handle errors from OAI
    err = root.find(".//oai:error", ns)
    if err is not None:
        code = err.attrib.get("code", "unknown")
        raise RuntimeError(f"OAI-PMH error: {code}: {err.text}")

    records_parent = root.find(".//oai:ListRecords", ns)
    if records_parent is None:
        # Could be no records match
        return [], None

    # Extract resumptionToken if present
    token_el = records_parent.find("./oai:resumptionToken", ns)
    token = token_el.text.strip() if (token_el is not None and token_el.text) else None

    # Yield each record
    def gen():
        for rec in records_parent.findall("./oai:record", ns):
            header = rec.find("./oai:header", ns)
            meta = rec.find("./oai:metadata", ns)
            deleted = header is not None and header.attrib.get("status") == "deleted"

            out: Dict = {"deleted": bool(deleted)}

            # Header fields
            if header is not None:
                identifier = header.findtext("./oai:identifier", default=None, namespaces=ns)
                datestamp = header.findtext("./oai:datestamp", default=None, namespaces=ns)
                set_specs = [e.text for e in header.findall("./oai:setSpec", ns) if e.text]
                out.update({
                    "oai_identifier": identifier,
                    "oai_datestamp": datestamp,
                    "oai_sets": set_specs,
                })

            # arXiv metadata format
            if meta is not None and not deleted:
                a = meta.find("./arxiv:arXiv", ns)
                if a is not None:
                    # Extract common fields safely
                    def tx(path: str) -> Optional[str]:
                        el = a.find(path, ns)
                        return el.text.strip() if (el is not None and el.text) else None

                    # Authors
                    authors = []
                    for au in a.findall("./arxiv:authors/arxiv:author", ns):
                        nm = au.findtext("./arxiv:keyname", default="", namespaces=ns)
                        fn = au.findtext("./arxiv:forenames", default=None, namespaces=ns)
                        aff = au.findtext("./arxiv:affiliation", default=None, namespaces=ns)
                        name = (f"{fn} {nm}".strip() if fn else nm).strip()
                        authors.append({"name": name, "forenames": fn, "keyname": nm, "affiliation": aff})

                    # Categories (primary + secondary)
                    primary_cat = tx("./arxiv:categories")
                    # Some metadata also has <arxiv:primary_category> in older schemas; keep both if present
                    prim = a.find("./arxiv:primary_category", ns)
                    primary_tag = prim.attrib.get("term") if prim is not None else None

                    out.update({
                        "id": tx("./arxiv:id"),
                        "created": tx("./arxiv:created"),
                        "updated": tx("./arxiv:updated"),
                        "title": tx("./arxiv:title"),
                        "abstract": tx("./arxiv:abstract"),
                        "comments": tx("./arxiv:comments"),
                        "doi": tx("./arxiv:doi"),
                        "journal_ref": tx("./arxiv:journal-ref"),
                        "license": tx("./arxiv:license"),
                        "authors": authors,
                        "categories": primary_cat.split() if primary_cat else [],
                        "primary_category": primary_tag,
                    })
                else:
                    # If metadataPrefix is not 'arXiv' (e.g., oai_dc), capture a generic dict
                    out["raw_metadata_xml"] = ET.tostring(meta, encoding="unicode")

            yield out

    return gen(), token

