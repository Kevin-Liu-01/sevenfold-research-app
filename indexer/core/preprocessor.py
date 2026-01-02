"""
preprocess.py

Extracts structured metadata + plain‑text from PDFs using GROBID,
computes a 64‑bit SimHash on the cleaned body text, and returns the result.
"""

import os
import re
from pathlib import Path
import json
import shutil
import logging
from typing import List

from lxml import etree
from dateutil.parser import parse
import anthropic
from grobid_client.grobid_client import GrobidClient
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils import compute_simhash

# Import .config
from .config import (
    PREPROCESSOR_TEI_NS,
    GROBID_CONFIG_PATH,
    PREPROCESSOR_HASH_BITS,
    PREPROCESSOR_NUM_CONCURRENT,
    PREPROCESSOR_TEI_FILE_SUFFIX,
    PREPROCESSOR_LLM_MODEL,
    PREPROCESSOR_LLM_MAX_TOKENS,
    PREPROCESSOR_LLM_TEMPERATURE,
    API_ANTHROPIC_API_KEY_ENV
)

logger = logging.getLogger(__name__)

class Preprocessor:

    def __init__(self, 
                 grobid_config: str = GROBID_CONFIG_PATH, 
                 hash_bits: int = PREPROCESSOR_HASH_BITS,
                 num_concurrent: int = PREPROCESSOR_NUM_CONCURRENT) -> None:
        self.grobid_client = GrobidClient(config_path=grobid_config)
        self.claude_client = anthropic.Anthropic(api_key=os.getenv(API_ANTHROPIC_API_KEY_ENV))
        self.hash_bits = hash_bits
        self.num_concurrent = num_concurrent

    def _remove_unwanted_sections(self, tei: etree._Element) -> None:
            xpaths = [
                "//tei:listBibl", "//tei:listCitation",
                "//tei:div[@type='acknowledgment']",
                "//tei:figure[@type='pageHeader']",
                "//tei:figure[@type='pageFooter']"
            ]
            for xp in xpaths:
                for node in tei.xpath(xp, namespaces=PREPROCESSOR_TEI_NS):
                    parent = node.getparent()
                    if parent is not None:
                        parent.remove(node)

    def _extract_abstract(self, tei: etree._Element) -> str:
        abstract_paths = [
            './/tei:div[@type="abstract"]',
            './/tei:teiHeader//tei:abstract',
            './/tei:teiHeader//tei:profileDesc//tei:abstract',
        ]
        for path in abstract_paths:
            node = tei.find(path, namespaces=PREPROCESSOR_TEI_NS)
            if node is not None:
                text_nodes = node.xpath(".//text()", namespaces=PREPROCESSOR_TEI_NS)
                abstract = " ".join(t.strip() for t in text_nodes if t.strip())
                if abstract:
                    return abstract
        
        return ""

    def _llm_abstract(self, body_text: str) -> str:
        prompt_template = \
        """
        You will be given the text content of a poorly formatted research paper PDF. Your task is to extract only the abstract of the paper — exactly as it appears in the text, without rephrasing or summarizing.

        Here is the text content of the PDF:

        <pdf_content>
        {{PDF_TEXT}}
        </pdf_content>

        Follow these steps to extract the abstract:

        1. Locate the abstract:
        - The abstract typically appears near the beginning of the paper, following the title, author list, and affiliations.
        - It is usually a single paragraph, around 150–300 words long.
        - Look for section headers like “Abstract” or “ABSTRACT”.
        - If there is no explicit label, use your judgment to identify the first full paragraph that appears to summarize the paper’s content.

        2. Output format:
        Provide only the raw abstract text, word for word, without any formatting or additional commentary. The output should be in the following format:

        <abstract>
        [Extracted abstract goes here]
        </abstract>

        3. Error handling:
        If you cannot identify the abstract with more than 90% confidence, return exactly and ONLY:

        <abstract>
        ABSTRACT NOT FOUND
        </abstract>

        Use your best judgment — formatting may vary, but return only the abstract as it appears in the source.
        """

        prompt = prompt_template.replace("{{PDF_TEXT}}", body_text[:2000])

        response = self.claude_client.messages.create(
            model=PREPROCESSOR_LLM_MODEL,
            max_tokens=PREPROCESSOR_LLM_MAX_TOKENS,
            temperature=PREPROCESSOR_LLM_TEMPERATURE,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        extracted_text = response.content[0].text.strip()
        if extracted_text.startswith("<abstract>") and extracted_text.endswith("</abstract>"):
            return "[Autoparsed] " + extracted_text[len("<abstract>"):-len("</abstract>")].strip()
        elif "ABSTRACT NOT FOUND" in extracted_text:
            return "ABSTRACT NOT FOUND"
        else:
            logger.warning(f"Unexpected LLM response format: {extracted_text}")
            return "ABSTRACT NOT FOUND"

    def _title_case(self, title: str) -> str:
        stopwords = {
            "a", "an", "the", "and", "but", "or", "nor", "for", "so",
            "yet", "at", "by", "in", "of", "on", "to", "up", "via", "with", "as"
        }

        def capitalize_word(word: str, is_first: bool) -> str:
            return word.capitalize() if is_first or word.lower() not in stopwords else word.lower()

        words = re.split(r"(\s+)", title.strip())  # preserve spacing
        result = [
            capitalize_word(word, i == 0) if word.strip() else word
            for i, word in enumerate(words)
        ]
        return "".join(result)

    def _extract_title(self, hdr: etree._Element) -> str:
        title = (
            hdr.findtext('.//tei:docTitle/tei:text', namespaces=PREPROCESSOR_TEI_NS)
            or hdr.findtext('.//tei:titleStmt/tei:title', namespaces=PREPROCESSOR_TEI_NS)
            or ""
        )

        title = re.sub(r"\s+", " ", title).strip(" :;,-")
        return self._title_case(title)

    def _extract_authors(self, hdr: etree._Element) -> List[str]:
        authors = []
        for author in hdr.findall('.//tei:author/tei:persName', namespaces=PREPROCESSOR_TEI_NS):
            forename = author.findtext('.//tei:forename[@type="first"]', namespaces=PREPROCESSOR_TEI_NS) or ""
            surname = author.findtext('.//tei:surname', namespaces=PREPROCESSOR_TEI_NS) or ""
            if forename or surname:
                authors.append(f"{forename} {surname}".strip())
        if not authors:
            for p in hdr.findall('.//tei:author//tei:p', namespaces=PREPROCESSOR_TEI_NS):
                if p.text and p.text.strip():
                    authors.append(p.text.strip())
        if not authors:
            for author in hdr.findall('.//tei:author', namespaces=PREPROCESSOR_TEI_NS):
                if author.text and author.text.strip():
                    authors.append(author.text.strip())
        return authors

    def _extract_date(self, hdr: etree._Element) -> str:
        raw_date = hdr.findtext('.//tei:publicationStmt//tei:date', namespaces=PREPROCESSOR_TEI_NS)
        if raw_date:
            try:
                dt = parse(raw_date, fuzzy=True)
                return (dt.year, dt.month, dt.day)
            except Exception:
                return None
        return None

    def _extract_body_text(self, tei: etree._Element) -> str:
        body_nodes = tei.xpath("//tei:text//tei:body//text()", namespaces=PREPROCESSOR_TEI_NS)
        return " ".join(t.strip() for t in body_nodes if t.strip())

    def _extract_source_from_tei(self, hdr: etree._Element) -> str:
        def get(path):
            return hdr.findtext(path, namespaces=PREPROCESSOR_TEI_NS)

        paper_title = (
            get('.//tei:titleStmt/tei:title') or
            get('.//tei:fileDesc/tei:titleStmt/tei:title') or ""
        ).strip()

        candidates = [
            get('.//tei:monogr/tei:title[@level="j"]'),
            get('.//tei:monogr/tei:title[@level="s"]'),
            get('.//tei:monogr/tei:title[@level="m"]'),
            get('.//tei:publicationStmt/tei:publisher'),
            get('.//tei:imprint/tei:publisher'),
            get('.//tei:meeting'),
            get('.//tei:sourceDesc//tei:biblStruct//tei:monogr/tei:title[@level="j"]'),
            get('.//tei:sourceDesc//tei:bibl//tei:title[@level="j"]'),
        ]
        for c in candidates:
            if c and c.strip() != paper_title:
                return c.strip()

        idnos = hdr.findall('.//tei:idno', namespaces=PREPROCESSOR_TEI_NS)
        for idno in idnos:
            if idno.text and ('arxiv' in idno.text.lower() or 'arXiv:' in idno.text):
                return "arXiv"

        dois = hdr.findall('.//tei:idno[@type="DOI"]', namespaces=PREPROCESSOR_TEI_NS)
        if dois:
            return "Published"

        venue = get('.//tei:notesStmt/tei:note[@type="venue"]')
        return venue.strip() if venue else "Unknown"

    def pdfs_to_teis(self, pdf_dir: str, tei_dir: str) -> None:
        """Process PDFs from a directory using GROBID batch processing to generate TEI files."""
        # Create output directory if it doesn't exist
        os.makedirs(tei_dir, exist_ok=True)
        
        # Process PDFs with GROBID to generate TEI files
        self.grobid_client.process("processFulltextDocument", pdf_dir, output=tei_dir, n=self.num_concurrent)

    def clear_teis(self, tei_dir: str) -> None:
        """Clear all TEI files from the output directory."""
        if os.path.exists(tei_dir):
            shutil.rmtree(tei_dir)
        os.makedirs(tei_dir, exist_ok=True)
            
    def extract_metadata(self, tei_dir: str, json_dir: str = None) -> list[dict] | None:
        """
        Clean all TEI files in a directory, extract metadata.

        If json_dir is specified, save JSON results there and return None.
        Otherwise, return a list of metadata dicts.
        """
        tei_files = [
            os.path.join(tei_dir, f) 
            for f in os.listdir(tei_dir) 
            if f.endswith(PREPROCESSOR_TEI_FILE_SUFFIX)
        ]

        os.makedirs(json_dir, exist_ok=True) if json_dir else None
        results = []

        def process_file(tei_path: str) -> dict | None:
            pdf_name = Path(tei_path).stem.replace(".grobid.tei", "")
            try:
                with open(tei_path, "r", encoding="utf-8") as f:
                    tei_xml = f.read()
                tei = etree.fromstring(tei_xml.encode("utf-8"))
                self._remove_unwanted_sections(tei)
                hdr = tei.find(".//tei:teiHeader", namespaces=PREPROCESSOR_TEI_NS)

                body_text = self._extract_body_text(tei)
                simhash = compute_simhash(body_text, self.hash_bits)

                abstract = self._extract_abstract(tei, hdr)
                if abstract == "": 
                    logger.info(f"Extracting abstract using LLM for {pdf_name}")
                    abstract = self._llm_abstract(body_text)

                year, month, day = self._extract_date(hdr) or (None, None, None)

                metadata = {
                    "pdf_name":          pdf_name,
                    "title":             self._extract_title(hdr),
                    "abstract":          abstract,
                    "source":            self._extract_source_from_tei(hdr),
                    "authors":           self._extract_authors(hdr),
                    "year":              year,
                    "month":             month,
                    "day":               day,
                    "body_text":         body_text,
                    "simhash":           simhash,
                }

                if not metadata["title"] or not metadata["body_text"] or not metadata["authors"]:
                    return None

                if json_dir:
                    output_file = os.path.join(json_dir, f"{pdf_name}.json")
                    with open(output_file, "w", encoding="utf-8") as out_f:
                        json.dump(metadata, out_f, indent=2, ensure_ascii=False)
                    return None
                else:
                    return metadata

            except Exception as e:
                logger.error(f"Failed to process {tei_path}: {e}")
                return None

        # Run all TEI file processing in parallel
        with ThreadPoolExecutor(max_workers=self.num_concurrent) as pool:
            futures = {pool.submit(process_file, tei_path): tei_path for tei_path in tei_files}
            for fut in as_completed(futures):
                result = fut.result()
                if result and not json_dir:
                    results.append(result)

        return None if json_dir else results
