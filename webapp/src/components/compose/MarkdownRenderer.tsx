import React from "react";
import { marked } from "marked";

marked.setOptions({
    gfm: true,
    breaks: true,
});

// Renders assistant messages as Markdown without KaTeX conversions.
const MarkdownRenderer: React.FC<{ content?: string }> = ({ content }) => {
    if (!content) return null;
    const html = marked.parse(content);

    return (
        <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed text-xs">
            <span dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};

export default MarkdownRenderer;
