export const DEFAULT_LATEX_TEMPLATE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{Your Title Here}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Write your introduction here.

\\section{Methods}
Describe your methods.

\\section{Results}
Present your results.

\\section{Conclusion}
Summarize your findings.

\\end{document}`;

export const MONACO_EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: "on" as const,
    lineNumbers: "on" as const,
    folding: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
};

export const EDITOR_DECORATION_STYLE_ID = "editor-decorations-styles";
export const EDITOR_DECORATION_STYLES = `
.line-decoration-delete {
    background-color: rgba(248, 113, 113, 0.15);
}
.line-decoration-insert {
    background-color: rgba(134, 239, 172, 0.15);
}
.line-decoration-glyph-delete {
    background-color: #f87171;
    width: 3px !important;
    margin-left: 3px;
}
.line-decoration-glyph-insert {
    background-color: #86efac;
    width: 3px !important;
    margin-left: 3px;
}
.text-decoration-line-through {
    text-decoration: line-through;
    opacity: 0.6;
}
`;
