from __future__ import annotations

from typing import List, Set

from pylatexenc.latexwalker import LatexWalker, LatexMacroNode
from pylatexenc.latex2text import LatexNodes2Text

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

"""
Parse LaTeX source and extract referenced dependencies (inputs, images, bibs, etc.).
This uses pylatexenc.latexwalker to walk the AST and capture argument values
from relevant macros.
"""

l2t = LatexNodes2Text()

MACROS_WITH_PATH_ARG = {
    "input": 1,
    "include": 1,
    "includeonly": 1,
    "includegraphics": 1,
    "graphicspath": 1,  # stores paths; we still record entries
    "bibliography": 1,
    "addbibresource": 1,
    "addbibresource*": 1,
    # "usepackage": 1,  # for local .sty files
    # "documentclass": 1,  # for local .cls files
}


def _extract_arg_text(node: LatexMacroNode, arg_index: int) -> str | None:
    if not node.nodeargd or not node.nodeargd.argnlist:
        return None

    actual_args = [arg for arg in node.nodeargd.argnlist if arg is not None]
    if arg_index >= len(actual_args):
        return None

    arg_node = actual_args[arg_index]

    nodelist = getattr(arg_node, "nodelist", None)
    if nodelist:
        return l2t.nodelist_to_text(nodelist).strip()

    return l2t.nodelist_to_text([arg_node]).strip()


def extract_dependencies(tex_source: str) -> List[str]:
    """
    Return a list of dependency paths referenced by the LaTeX source.

    Covers: \\input, \\include, \\includegraphics, \\bibliography, \\addbibresource,
    \\usepackage (for local sty), \\documentclass (for local cls), graphicspath entries.
    """
    walker = LatexWalker(tex_source, tolerant_parsing=True)
    nodes, _, _ = walker.get_latex_nodes()

    logger.debug(f"Parsing LaTeX source for dependencies, found {len(nodes)} top-level nodes")

    deps: Set[str] = set()

    def walk(node):
        if isinstance(node, LatexMacroNode):
            macro = node.macroname
            if macro in MACROS_WITH_PATH_ARG:
                logger.debug(f"Found macro: \\{macro}")
                arg_idx = MACROS_WITH_PATH_ARG[macro] - 1  # zero-based
                arg_text = _extract_arg_text(node, arg_idx)
                logger.debug(f"Extracted argument text: {arg_text}")
                if arg_text:
                    # graphicspath may contain braces-separated list; split on spaces/braces
                    if macro == "graphicspath":
                        for part in arg_text.replace("{", " ").replace("}", " ").split():
                            if part:
                                deps.add(part)
                    else:
                        deps.add(arg_text)
        for child in getattr(node, "nodelist", []) or []:
            walk(child)

    for n in nodes:
        walk(n)

    return sorted(deps)
