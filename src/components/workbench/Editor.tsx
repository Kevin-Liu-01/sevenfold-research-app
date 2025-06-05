import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const Editor: React.FC = () => {
  const [mode, setMode] = useState<'markdown' | 'latex'>('markdown');
  const [content, setContent] = useState<string>('');
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  // Re-render preview 300 ms after user stops typing or switches mode
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'markdown') {
        const html = marked.parse(content, {
          gfm: true,
          breaks: true,
          headerIds: true,
          mangle: false,
        });
        setRenderedHtml(html);
      } else {
        // LaTeX mode
        try {
          // renderToString returns HTML markup (wrapped in KaTeX spans)
          const html = katex.renderToString(content, {
            throwOnError: false,
            displayMode: true,
          });
          setRenderedHtml(html);
        } catch {
          // Fallback: show raw text if KaTeX fails
          setRenderedHtml(content);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, mode]);

  return (
    <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Editor</h2>

        <div className="mb-4">
            <label htmlFor="mode" className="mr-4 font-semibold">
            Mode:
            </label>
            <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'markdown' | 'latex')}
            className="p-2 border border-gray-300 rounded"
            >
            <option value="markdown">Markdown</option>
            <option value="latex">LaTeX</option>
            </select>
        </div>

        <div className="flex h-[80vh] border border-gray-300 rounded overflow-hidden">
            <textarea
            className="w-1/2 h-full p-4 font-mono text-base resize-none border-r border-gray-300 outline-none focus:outline-none"
            placeholder={
                mode === 'markdown'
                ? 'Type Markdown here…'
                : 'Type LaTeX here (e.g. E = mc^2)…'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            />
            <div className="w-1/2 h-full p-4 overflow-auto bg-white">
            <div
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
            </div>
        </div>
        </div>
  );
};

export default Editor;
