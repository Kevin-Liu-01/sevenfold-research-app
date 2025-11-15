import React from "react";
import Editor from "@monaco-editor/react";
import "katex/dist/katex.min.css";
import LatexPdfPreview from "../ui/LatexPdfPreview";
import TiptapEditor from "../ui/tiptap/TiptapEditor";
import type { EditProposal } from "../../types/compose";
import { useWorkbench } from "../../context/WorkbenchContext";
import { useCompositionContent } from "../../hooks/useCompositionContent";
import { useProposalPreview } from "../../hooks/useProposalPreview";
import {
    EDITOR_DECORATION_STYLE_ID,
    EDITOR_DECORATION_STYLES,
    MONACO_EDITOR_OPTIONS,
} from "../../constants/compose";

if (typeof document !== "undefined" && !document.getElementById(EDITOR_DECORATION_STYLE_ID)) {
    const styleElement = document.createElement("style");
    styleElement.id = EDITOR_DECORATION_STYLE_ID;
    styleElement.innerHTML = EDITOR_DECORATION_STYLES;
    document.head.appendChild(styleElement);
}

interface ComposeEditorProps {
    pendingProposals: EditProposal[];
    onAcceptProposal: (id: string, newContent: string) => void;
    onRejectProposal: (id: string) => void;
}

const ComposeEditor: React.FC<ComposeEditorProps> = ({ pendingProposals, onAcceptProposal, onRejectProposal }) => {
    const { selectedComposition, refreshCompositions } = useWorkbench();
    const {
        mode,
        setMode,
        content,
        setContent,
        title,
        setTitle,
        compileCounter,
        incrementCompileCounter,
        renderedHtml,
        handleLatexEditorChange,
        handleEditorMount,
    } = useCompositionContent({ selectedComposition, refreshCompositions });
    const { displayContent, editorRef, monacoRef } = useProposalPreview({
        selectedComposition,
        pendingProposals,
        onAcceptProposal,
        onRejectProposal,
    });

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

    return (
        <div className="flex flex-col h-full bg-gray-50">
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
                            onClick={incrementCompileCounter}
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
                            className="px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
                        >
                            <option value="docx">Rich Text (DOCX)</option>
                            <option value="latex">LaTeX</option>
                            <option value="markdown">Markdown</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {mode === "docx" ? (
                    <div className="flex-1">
                        <TiptapEditor content={content} onChange={(newContent) => setContent(newContent)} />
                    </div>
                ) : mode === "markdown" ? (
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="markdown-editor" className="sr-only">
                                Markdown editor
                            </label>
                            <Editor
                                height="100%"
                                language="markdown"
                                value={pendingProposals.length > 0 ? displayContent : content}
                                onChange={(value) => {
                                    if (pendingProposals.length === 0) {
                                        setContent(value || "");
                                    }
                                }}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    monacoRef.current = monaco;
                                }}
                                theme="vs-light"
                                options={{
                                    ...MONACO_EDITOR_OPTIONS,
                                    readOnly: pendingProposals.length > 0,
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
                    <>
                        <div className="w-1/2 flex flex-col border-r border-gray-200">
                            <label htmlFor="editor-area" className="sr-only">
                                LaTeX editor
                            </label>
                            <Editor
                                height="100%"
                                language="latex"
                                value={pendingProposals.length > 0 ? displayContent : content}
                                onChange={(value, ev) => {
                                    if (pendingProposals.length === 0) {
                                        handleLatexEditorChange(value, ev);
                                    }
                                }}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    monacoRef.current = monaco;
                                    handleEditorMount(editor, monaco);
                                }}
                                theme="vs-light"
                                options={{
                                    ...MONACO_EDITOR_OPTIONS,
                                    readOnly: pendingProposals.length > 0,
                                }}
                            />
                        </div>
                        <div className="w-1/2 overflow-auto bg-white">
                            <LatexPdfPreview compositionId={selectedComposition.id} triggerCompile={compileCounter} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ComposeEditor;
