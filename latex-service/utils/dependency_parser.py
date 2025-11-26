from __future__ import annotations

from typing import List, Set

from pylatexenc.latexwalker import LatexWalker, LatexMacroNode
from pylatexenc.latex2text import LatexNodes2Text

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

l2t = LatexNodes2Text()

# 1-based arg indices (as you had), but:
# - includegraphics: use "last"
MACROS_WITH_PATH_ARG = {
    "input": 1,
    "include": 1,
    "includeonly": 1,
    "includegraphics": "last",
    "graphicspath": 1,  # list of dirs
    "bibliography": 1,
    "addbibresource": 1,  # handles both starred/non-starred via node.star
}

DEFAULT_EXTENSIONS = {
    "input": ".tex",
    "include": ".tex",
    "includeonly": ".tex",
    "bibliography": ".bib",
    "addbibresource": ".bib",  # applies to both star/non-star
}


def _normalize_path(macro: str, path: str) -> str:
    path = path.strip()
    if not path:
        return path

    # Don't add extensions to obvious dirs (ending in '/')
    if path.endswith("/"):
        return path

    ext = DEFAULT_EXTENSIONS.get(macro)
    if ext and not path.endswith(ext):
        return f"{path}{ext}"
    return path


def _extract_arg_text(node: LatexMacroNode, arg_index: int) -> str | None:
    if not node.nodeargd or not node.nodeargd.argnlist:
        return None

    argnlist = node.nodeargd.argnlist
    if arg_index < 0 or arg_index >= len(argnlist):
        return None

    arg_node = argnlist[arg_index]
    if arg_node is None:
        return None

    nodelist = getattr(arg_node, "nodelist", None)
    if nodelist is not None:
        return l2t.nodelist_to_text(nodelist).strip()

    return l2t.nodelist_to_text([arg_node]).strip()


def extract_dependencies(tex_source: str) -> List[str]:
    """
    Return a list of dependency paths referenced by the LaTeX source.

    Covers: \\input, \\include, \\includeonly, \\includegraphics, \\bibliography,
    \\addbibresource (starred & unstarred), \\graphicspath.
    """
    walker = LatexWalker(tex_source, tolerant_parsing=True)
    nodes, _, _ = walker.get_latex_nodes()

    deps: Set[str] = set()

    def visit(node):
        if isinstance(node, LatexMacroNode):
            macro = node.macroname

            if macro in MACROS_WITH_PATH_ARG:
                arg_spec = MACROS_WITH_PATH_ARG[macro]

                if arg_spec == "last":
                    # e.g. includegraphics: last argument is the path
                    if node.nodeargd and node.nodeargd.argnlist:
                        arg_index = len(node.nodeargd.argnlist) - 1
                    else:
                        arg_index = -1
                else:
                    arg_index = arg_spec - 1  # 1-based to 0-based

                if arg_index >= 0:
                    arg_text = _extract_arg_text(node, arg_index)
                else:
                    arg_text = None

                if arg_text:
                    if macro == "graphicspath":
                        # \graphicspath{{dir1/}{dir2/}}
                        for part in arg_text.replace("{", " ").replace("}", " ").split():
                            part = part.strip()
                            if part:
                                deps.add(part)

                    elif macro in ("bibliography", "addbibresource"):
                        # \bibliography{foo,bar} / \addbibresource{foo.bib}
                        for item in arg_text.split(","):
                            item = item.strip()
                            if not item:
                                continue
                            deps.add(_normalize_path(macro, item))

                    else:
                        deps.add(_normalize_path(macro, arg_text))

        # Recurse into children
        child_nodelist = getattr(node, "nodelist", None)
        if child_nodelist:
            for child in child_nodelist:
                visit(child)

    for n in nodes:
        visit(n)

    return sorted(deps)

