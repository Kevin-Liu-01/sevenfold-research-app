import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";
import supabase from "../auth/supabaseClient";
import { useWorkbench } from "../context/WorkbenchContext";

const Editor: React.FC = () => {
    const { selectedComposition, refreshCompositions } = useWorkbench();
    // If no composition is selected, show placeholder
    if (!selectedComposition) {
        return (
            <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
                <div className="text-center">
                    <span className="material-icons text-6xl text-gray-300 mb-4">description</span>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No Composition Selected</h3>
                    <p className="text-gray-400">Select a composition from the sidebar to start editing</p>
                </div>
            </div>
        );
    }

    // state & refs
    const [mode, setMode] = useState<"markdown" | "latex">(selectedComposition.type as "markdown" | "latex");
    const [content, setContent] = useState(selectedComposition.contents || "");
    const [title, setTitle] = useState(selectedComposition.title || "Untitled");
    const [renderedHtml, setRenderedHtml] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isInitialLoad = useRef(true);

    // Update state when selectedComposition changes
    useEffect(() => {
        if (selectedComposition) {
            setMode(selectedComposition.type as "markdown" | "latex");
            setContent(selectedComposition.contents || "");
            setTitle(selectedComposition.title || "Untitled");
            isInitialLoad.current = true;
        }
    }, [selectedComposition.id]);

    // Load full composition content
    useEffect(() => {
        if (!selectedComposition?.id) return;
        (async () => {
            const {
                data: { session },
                error: authErr,
            } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) return;
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/${selectedComposition.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setContent(data.contents || "");
                setTitle(data.title || "Untitled");
                setMode(data.type as "markdown" | "latex");
            }
        })();
    }, [selectedComposition?.id]);

    // render preview (debounce)
    useEffect(() => {
        const t = setTimeout(async () => {
            if (mode === "markdown") {
                const html = await marked.parse(content, {
                    gfm: true,
                    breaks: true,
                });
                setRenderedHtml(html);
            } else {
                try {
                    setRenderedHtml(
                        katex.renderToString(content, {
                            throwOnError: false,
                            displayMode: true,
                        })
                    );
                } catch {
                    setRenderedHtml(content);
                }
            }
        }, 300);
        return () => clearTimeout(t);
    }, [content, mode]);

    // auto‑save (debounce)
    useEffect(() => {
        const t = setTimeout(() => {
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }
            (async () => {
                const {
                    data: { session },
                    error: authErr,
                } = await supabase.auth.getSession();
                if (authErr || !session?.access_token || !selectedComposition?.id) return;
                
                try {
                    const res = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/compose/update/${selectedComposition.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({ 
                                contents: content,
                                title: title,
                                type: mode
                            }),
                        }
                    );
                    
                    if (res.ok) {
                        // Refresh compositions list to show updated title/type
                        refreshCompositions();
                    }
                } catch (error) {
                    console.error('Failed to save composition:', error);
                }
            })();
        }, 1000);
        return () => clearTimeout(t);
    }, [content, title, mode, selectedComposition?.id, refreshCompositions]);

    // formatting helpers
    const applyInline = (pre: string, post: string = pre) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.slice(selectionStart, selectionEnd);
        const newText =
            value.slice(0, selectionStart) + pre + selected + post + value.slice(selectionEnd);
        setContent(newText);
        // restore cursor
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(
                selectionStart + pre.length,
                selectionStart + pre.length + selected.length
            );
        }, 0);
    };

    const applyLine = (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const { selectionStart, selectionEnd, value } = ta;
        const before = value.slice(0, selectionStart);
        const selected = value.slice(selectionStart, selectionEnd);
        const after = value.slice(selectionEnd);
        const lines = selected
            .split("\n")
            .map((l) => (l.trim() ? prefix + l : l))
            .join("\n");
        setContent(before + lines + after);
        setTimeout(() => ta?.focus(), 0);
    };

    const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* header */}
            <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4 flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Composition title..."
                        className="text-xl font-semibold text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1 flex-1"
                    />
                </div>
                <div>
                    <label htmlFor="mode-select" className="sr-only">
                        Editor mode
                    </label>
                    <select
                        id="mode-select"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as "markdown" | "latex")}
                        className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="markdown">Markdown</option>
                        <option value="latex">LaTeX</option>
                    </select>
                </div>
            </div>

            {/* toolbar */}
            <div
                role="toolbar"
                aria-label="Formatting options"
                className="flex flex-wrap items-center gap-2 px-6 pt-1 bg-white border-b border-gray-200"
            >
                {[
                    {
                        fn: () => applyInline("**"),
                        icon: "format_bold",
                        label: "Bold",
                    },
                    {
                        fn: () => applyInline("_"),
                        icon: "format_italic",
                        label: "Italic",
                    },
                    {
                        fn: () => applyLine("## "),
                        icon: "title",
                        label: "Heading",
                    },
                    {
                        fn: () => applyLine("> "),
                        icon: "format_quote",
                        label: "Blockquote",
                    },
                    {
                        fn: () => applyLine("- "),
                        icon: "format_list_bulleted",
                        label: "Bullet list",
                    },
                    {
                        fn: () => applyLine("1. "),
                        icon: "format_list_numbered",
                        label: "Numbered list",
                    },
                    {
                        fn: () => applyInline("`"),
                        icon: "code",
                        label: "Inline code",
                    },
                    {
                        fn: () => applyInline("```\\n", "\\n```"),
                        icon: "code",
                        label: "Code block",
                    },
                    {
                        fn: () => applyInline("$$", "$$"),
                        icon: "functions",
                        label: "Math",
                    },
                    {
                        fn: () => applyInline("[", "](url)"),
                        icon: "link",
                        label: "Link",
                    },
                    {
                        fn: () => applyInline("![](", ")"),
                        icon: "image",
                        label: "Image",
                    },
                ].map(({ fn, icon, label }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={fn}
                        aria-label={label}
                        title={label}
                        className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <span className="material-icons text-gray-600">{icon}</span>
                    </button>
                ))}
            </div>

            {/* editor + preview */}
            <div className="flex flex-1 divide-x divide-gray-200 overflow-hidden">
                <div className="w-1/2 p-4">
                    <label htmlFor="editor-area" className="sr-only">
                        {mode === "markdown" ? "Markdown editor" : "LaTeX editor"}
                    </label>
                    <textarea
                        id="editor-area"
                        ref={textareaRef}
                        value={content}
                        onChange={onChange}
                        placeholder={
                            mode === "markdown" ? "Type Markdown here…" : "Type LaTeX here…"
                        }
                        className="w-full h-full p-2 font-mono text-sm text-gray-800 resize-none
                       focus:outline-none focus:ring-2 rounded-sm focus:ring-orange-500 border border-transparent"
                    />
                </div>
                <div
                    className="w-1/2 p-4 overflow-auto bg-white"
                    role="region"
                    aria-label="Preview"
                    aria-live="polite"
                >
                    <div
                        className="prose prose-sm sm:prose lg:prose-lg text-gray-800"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Editor;
