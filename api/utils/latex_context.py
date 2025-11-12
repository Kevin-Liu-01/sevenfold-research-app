from __future__ import annotations

from typing import Dict, List


CLEANABLE_COMMANDS = [
    r"\cite{",
    r"\parencite{",
    r"\footnote{",
    r"\url{",
    r"\href{",
    r"\label{",
    r"\bibliography{",
]

MATH_BLOCK_DELIMS = [
    ("$", "$"),
    ("\\[", "\\]"),
]

LATEX_ENVIRONMENTS = [
    "equation",
    "align",
    "gather",
    "multline",
    "theorem",
    "lemma",
    "figure",
    "table",
]


def _clean_context(raw_context: str, max_chars: int, take_suffix: bool) -> Dict[str, object]:
    """
    Clean a LaTeX context window by removing noisy commands and preserving math blocks.
    Returns a dict with the cleaned excerpt and metadata for logging.
    """
    if not raw_context:
        return {
            "excerpt": "",
            "cursor_offset": 0,
            "paragraph_count": 0,
            "math_blocks_preserved": 0,
        }

    working = raw_context[-max_chars:] if take_suffix else raw_context[:max_chars]
    cleaned_chars: List[str] = []
    math_blocks_preserved = 0
    i = 0
    length = len(working)

    def _starts_with_any(prefixes):
        return next((p for p in prefixes if working.startswith(p, i)), None)

    while i < length:
        cmd = _starts_with_any(CLEANABLE_COMMANDS)
        if cmd:
            depth = 1
            i += len(cmd)
            while i < length and depth > 0:
                if working[i] == "{":
                    depth += 1
                elif working[i] == "}":
                    depth -= 1
                i += 1
            continue

        math_match = None
        for start, end in MATH_BLOCK_DELIMS:
            if working.startswith(start, i):
                math_match = (start, end)
                break
        if math_match:
            start, end = math_match
            end_idx = working.find(end, i + len(start))
            if end_idx == -1:
                cleaned_chars.append(working[i])
                i += 1
            else:
                block = working[i:end_idx + len(end)]
                cleaned_chars.append(block)
                math_blocks_preserved += 1
                i = end_idx + len(end)
            continue

        env_match = next(
            (env for env in LATEX_ENVIRONMENTS if working.startswith(f"\\begin{{{env}}}", i)),
            None,
        )
        if env_match:
            begin_tag = f"\\begin{{{env_match}}}"
            end_tag = f"\\end{{{env_match}}}"
            end_idx = working.find(end_tag, i + len(begin_tag))
            if end_idx == -1:
                cleaned_chars.append(working[i])
                i += 1
            else:
                block = working[i:end_idx + len(end_tag)]
                cleaned_chars.append(block)
                i = end_idx + len(end_tag)
            continue

        cleaned_chars.append(working[i])
        i += 1

    compressed = "".join(cleaned_chars)
    paragraphs = [p for p in compressed.split("\n\n") if p.strip()]

    return {
        "excerpt": compressed,
        "cursor_offset": len(compressed),
        "paragraph_count": len(paragraphs),
        "math_blocks_preserved": math_blocks_preserved,
    }


def clean_context_window(raw_context: str, max_chars: int = 4000) -> Dict[str, object]:
    """Clean up to max_chars before the cursor (suffix of the string)."""
    return _clean_context(raw_context, max_chars, take_suffix=True)


def clean_context_suffix(raw_context: str, max_chars: int = 1000) -> Dict[str, object]:
    """Clean up to max_chars after the cursor (prefix of the string)."""
    return _clean_context(raw_context, max_chars, take_suffix=False)
