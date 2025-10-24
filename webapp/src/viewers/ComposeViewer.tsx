import React, { useState, useEffect, useRef } from "react";
import type { Composition } from "../../../schema/db-types";
import supabase from "../auth/supabaseClient";
import { useWorkbench } from "../context/WorkbenchContext";
import Editor from "@monaco-editor/react";
import { marked } from "marked";
import LatexPdfPreview from "../components/ui/LatexPdfPreview";
import TiptapEditor from "../components/ui/tiptap/TiptapEditor";

const CompositionListPanel: React.FC<{
    compositions: Composition[];
    selectedComposition: Composition | null;
    onSelectComposition: (composition: Composition) => void;
    onNewComposition: () => void;
    isCreating: boolean;
}> = ({ compositions, selectedComposition, onSelectComposition, onNewComposition, isCreating }) => {

    return (
        <div className="w-64 bg-app-outer border-r border-gray-200 p-4 flex flex-col space-y-3">
            <button
                onClick={onNewComposition}
                disabled={isCreating}
                className="group inline-flex items-center space-x-1 bg-[var(--color-off-black)] text-[var(--color-app-inner)] text-sm font-medium px-2 py-1 rounded-md transition hover:opacity-90 disabled:opacity-50"
            >
                {isCreating ? (
                    <span className="material-icons text-base animate-spin text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                        refresh
                    </span>
                ) : (
                    <span className="material-icons text-base text-[var(--color-app-inner)] transition-transform duration-200 group-hover:scale-[1.15]">
                        add
                    </span>
                )}
                <span>{isCreating ? "Creating..." : "New Composition"}</span>
            </button>

            <div className="flex-1 overflow-y-auto">
                {compositions.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-4">No compositions found</div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        {compositions.map((composition) => (
                            <div
                                key={composition.id}
                                onClick={() => onSelectComposition(composition)}
                                className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                                    ${selectedComposition?.id === composition.id ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
                                `}
                            >
                                <div className="flex items-center space-x-1">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                            {composition.title || "Untitled"}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                            {composition.type?.toUpperCase() || "UNKNOWN"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const EditorComponent: React.FC = () => {
    const { selectedComposition, refreshCompositions } = useWorkbench();
    // If no composition is selected, show placeholder
    if (!selectedComposition) {
        return (
            <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
                <div className="text-center">
                    <span className="material-icons text-6xl text-gray-300 mb-4">description</span>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No Composition Selected</h3>
                    <p className="text-gray-400">Select or create a composition to start editing</p>
                </div>
            </div>
        );
    }

    // state & refs
    const [mode, setMode] = useState<"docx" | "latex" | "markdown">(selectedComposition.type as "docx" | "latex" | "markdown");
    const [content, setContent] = useState(selectedComposition.contents || "");
    const [title, setTitle] = useState(selectedComposition.title || "Untitled");
    const [compileCounter, setCompileCounter] = useState(0);
    const [renderedHtml, setRenderedHtml] = useState("");
    const isInitialLoad = useRef(true);

    // Update state when selectedComposition changes
    useEffect(() => {
        if (selectedComposition) {
            setMode(selectedComposition.type as "docx" | "latex" | "markdown");
            setContent(selectedComposition.contents || "");
            setTitle(selectedComposition.title || "Untitled");
            isInitialLoad.current = true;
        }
    }, [selectedComposition.id]);

    // render markdown preview (debounce)
    useEffect(() => {
        const t = setTimeout(async () => {
            if (mode === "markdown") {
                const html = await marked.parse(content, {
                    gfm: true,
                    breaks: true,
                });
                setRenderedHtml(html);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [content, mode]);

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
                setMode(data.type as "docx" | "latex" | "markdown");
            }
        })();
    }, [selectedComposition?.id]);

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
                <div className="flex items-center space-x-3">
                    {mode === "latex" && (
                        <button
                            onClick={() => setCompileCounter(c => c + 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            title="Compile LaTeX to PDF (Ctrl+Shift+B)"
                        >
                            <span className="material-icons text-base">play_arrow</span>
                            <span className="font-medium">Compile PDF</span>
                        </button>
                    )}
                    <div>
                        <label htmlFor="mode-select" className="sr-only">
                            Editor mode
                        </label>
                        <select
                            id="mode-select"
                            value={mode}
                            onChange={(e) => setMode(e.target.value as "docx" | "latex" | "markdown")}
                            className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="docx">Rich Text (DOCX)</option>
                            <option value="latex">LaTeX</option>
                            <option value="markdown">Markdown</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* editor content */}
            <div className="flex flex-1 overflow-hidden">
                {mode === "docx" ? (
                    /* Rich text editor (DOCX-like) - full width WYSIWYG */
                    <div className="flex-1">
                        <TiptapEditor
                            content={content}
                            onChange={(newContent) => setContent(newContent)}
                        />
                    </div>
                ) : mode === "markdown" ? (
                    /* Split view for Markdown: Monaco editor on left, rendered preview on right */
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="markdown-editor" className="sr-only">
                                Markdown editor
                            </label>
                            <Editor
                                height="100%"
                                language="markdown"
                                value={content}
                                onChange={(value) => setContent(value || "")}
                                theme="vs-light"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    lineNumbers: "on",
                                    folding: true,
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                }}
                            />
                        </div>
                        <div className="w-1/2 overflow-auto bg-white p-8">
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        </div>
                    </>
                ) : (
                    /* Split view for LaTeX: Monaco editor on left, PDF preview on right */
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="editor-area" className="sr-only">
                                LaTeX editor
                            </label>
                            <Editor
                                height="100%"
                                language="latex"
                                value={content}
                                onChange={(value) => setContent(value || "")}
                                theme="vs-light"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    lineNumbers: "on",
                                    folding: true,
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                }}
                            />
                        </div>
                        <div className="w-1/2 overflow-auto bg-white">
                            <LatexPdfPreview 
                                compositionId={selectedComposition.id}
                                triggerCompile={compileCounter}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ComposeViewer: React.FC = () => {
    const { projectId, compositions, selectedComposition, setSelectedComposition, refreshCompositions } = useWorkbench();
    const [isCreating, setIsCreating] = useState(false);

    const handleSelectComposition = (composition: Composition) => {
        setSelectedComposition(composition);
    };

    const createNewComposition = async () => {
        setIsCreating(true);
        try {
            const {
                data: { session },
                error: authErr,
            } = await supabase.auth.getSession();
            if (authErr || !session?.access_token) {
                throw new Error("Not authenticated");
            }

            // Default LaTeX template for new compositions
            const defaultLatexContent = `\\documentclass{article}
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

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/compose/new_composition`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        type: "latex",
                        title: "",
                        contents: defaultLatexContent,
                    }),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create composition: ${res.status} – ${text}`);
            }

            const newComposition = await res.json();
            setSelectedComposition(newComposition);
            await refreshCompositions();
        } catch (error: unknown) {
            console.error("Error creating composition:", error);
            alert(error instanceof Error ? error.message : "Failed to create composition");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex h-full bg-app-inner">
            <CompositionListPanel
                compositions={compositions}
                selectedComposition={selectedComposition}
                onSelectComposition={handleSelectComposition}
                onNewComposition={createNewComposition}
                isCreating={isCreating}
            />
            <div className="flex-1">
                <EditorComponent />
            </div>
        </div>
    );
};

export default ComposeViewer;
