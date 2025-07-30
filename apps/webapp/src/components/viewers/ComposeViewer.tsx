import React, { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";
import supabase from "../../services/supabaseClient";

interface EditorProps {
    projectId: string;
}

const COOKIE_NAME = "editorMode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

// Simple cookie getters/setters
function getCookie(name: string): string | null {
    const match = document.cookie.match(
        new RegExp("(?:^|; )" + name + "=([^;]*)"),
    );
    return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
    document.cookie =
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ` +
        `max-age=${maxAgeSeconds}; path=/;`;
}

const Editor: React.FC<EditorProps> = ({ projectId }) => {
    // 1) Initialize mode from cookie (fallback to 'markdown')
    const [mode, setMode] = useState<"markdown" | "latex">(() => {
        const saved = getCookie(COOKIE_NAME);
        return saved === "latex" ? "latex" : "markdown";
    });

    const [content, setContent] = useState("");
    const [renderedHtml, setRenderedHtml] = useState("");
    const isInitialLoad = useRef(true);

    // 2) Persist mode changes to cookie
    useEffect(() => {
        setCookie(COOKIE_NAME, mode, COOKIE_MAX_AGE);
    }, [mode]);

    // 3) Load existing content on mount
    useEffect(() => {
        if (!projectId) return;
        (async () => {
            const {
                data: { session },
                error: authErr,
            } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) {
                console.error("Not authenticated", authErr);
                return;
            }

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/get-editor-content`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                },
            );
            if (!res.ok) {
                console.error(`Load failed (${res.status}):`, await res.text());
                return;
            }
            const data = await res.json();
            setContent(data.editor_content ?? "");
        })();
    }, [projectId]);

    // 4) Render preview
    useEffect(() => {
        const t = setTimeout(() => {
            if (mode === "markdown") {
                setRenderedHtml(
                    marked.parse(content, {
                        gfm: true,
                        breaks: true,
                        headerIds: true,
                        mangle: false,
                    }),
                );
            } else {
                try {
                    setRenderedHtml(
                        katex.renderToString(content, {
                            throwOnError: false,
                            displayMode: true,
                        }),
                    );
                } catch {
                    setRenderedHtml(content);
                }
            }
        }, 300);
        return () => clearTimeout(t);
    }, [content, mode]);

    // 5) Auto-save edits
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
                if (authErr || !session?.access_token) {
                    console.error("Not authenticated", authErr);
                    return;
                }

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/editor-content`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ editor_content: content }),
                    },
                );
                if (!res.ok) {
                    console.error(
                        `Save failed (${res.status}):`,
                        await res.text(),
                    );
                }
            })();
        }, 1000);
        return () => clearTimeout(t);
    }, [content, projectId]);

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
                    onChange={(e) =>
                        setMode(e.target.value as "markdown" | "latex")
                    }
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
                        mode === "markdown"
                            ? "Type Markdown here…"
                            : "Type LaTeX here…"
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="w-1/2 h-full p-4 overflow-auto bg-white">
                    <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                </div>
            </div>
        </div>
    );
};

export default Editor;
