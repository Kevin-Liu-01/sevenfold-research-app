import { useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import type { Composition } from "../../../schema/db-types";
import type { EditProposal } from "../types/compose";

type MonacoEditor = Parameters<OnMount>[0];
type MonacoApi = Parameters<OnMount>[1];
type Decoration = Parameters<MonacoEditor["deltaDecorations"]>[1][number];
type ContentWidget = Parameters<MonacoEditor["addContentWidget"]>[0];

interface UseProposalPreviewArgs {
    selectedComposition: Composition | null;
    pendingProposals: EditProposal[];
    onAcceptProposal: (id: string, newContent: string) => void;
    onRejectProposal: (id: string) => void;
}

// Builds read-only editor content reflecting pending proposals and applies decorations/widgets.
export const useProposalPreview = ({
    selectedComposition,
    pendingProposals,
    onAcceptProposal,
    onRejectProposal,
}: UseProposalPreviewArgs) => {
    const editorRef = useRef<MonacoEditor | null>(null);
    const monacoRef = useRef<MonacoApi | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const widgetsRef = useRef<ContentWidget[]>([]);
    const [displayContent, setDisplayContent] = useState("");
    const finalContentRef = useRef("");

    useEffect(() => {
        if (!selectedComposition?.contents) {
            setDisplayContent("");
            finalContentRef.current = "";
            return;
        }

        const original = selectedComposition.contents;

        if (pendingProposals.length === 0) {
            setDisplayContent(original);
            finalContentRef.current = original;
            return;
        }

        const allOps = pendingProposals.flatMap((p) => p.operations || []);
        const sortedOps = [...allOps].sort((a, b) => b.start_line - a.start_line);

        const displayLines = original.split("\n");
        for (const op of sortedOps) {
            const startIdx = op.start_line - 1;
            const endIdx = op.end_line - 1;

            if (op.type === "insert" && op.new_text) {
                const newLines = op.new_text.split("\n");
                displayLines.splice(startIdx, 0, ...newLines);
            } else if (op.type === "replace" && op.new_text) {
                const newLines = op.new_text.split("\n");
                displayLines.splice(endIdx + 1, 0, ...newLines);
            }
        }
        setDisplayContent(displayLines.join("\n"));

        const finalLines = original.split("\n");
        for (const op of sortedOps) {
            const startIdx = op.start_line - 1;
            const endIdx = op.end_line - 1;

            if (op.type === "delete") {
                finalLines.splice(startIdx, endIdx - startIdx + 1);
            } else if (op.type === "insert" && op.new_text) {
                const newLines = op.new_text.split("\n");
                finalLines.splice(startIdx, 0, ...newLines);
            } else if (op.type === "replace" && op.new_text) {
                const newLines = op.new_text.split("\n");
                finalLines.splice(startIdx, endIdx - startIdx + 1, ...newLines);
            }
        }
        finalContentRef.current = finalLines.join("\n");
    }, [selectedComposition?.contents, pendingProposals]);

    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) {
            return;
        }

        widgetsRef.current.forEach((widget) => {
            editorRef.current.removeContentWidget(widget);
        });
        widgetsRef.current = [];

        if (pendingProposals.length === 0) {
            if (decorationsRef.current.length > 0) {
                editorRef.current.deltaDecorations(decorationsRef.current, []);
                decorationsRef.current = [];
            }
            return;
        }

        const decorations: Decoration[] = [];
        let lineOffset = 0;

        pendingProposals.forEach((proposal) => {
            if (proposal.operations && proposal.operations.length > 0) {
                const firstOp = proposal.operations[0];

                const widgetNode = document.createElement("div");
                widgetNode.className = "inline-flex gap-1 items-center ml-2";
                widgetNode.style.cssText =
                    "background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";

                const acceptBtn = document.createElement("button");
                acceptBtn.innerHTML = "✓";
                acceptBtn.className = "hover:bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded transition";
                acceptBtn.title = "Accept edit";
                acceptBtn.onclick = (e) => {
                    e.stopPropagation();
                    onAcceptProposal(proposal.id, finalContentRef.current);
                };

                const rejectBtn = document.createElement("button");
                rejectBtn.innerHTML = "✕";
                rejectBtn.className = "hover:bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded transition";
                rejectBtn.title = "Reject edit";
                rejectBtn.onclick = (e) => {
                    e.stopPropagation();
                    onRejectProposal(proposal.id);
                };

                widgetNode.appendChild(acceptBtn);
                widgetNode.appendChild(rejectBtn);

                const widget: ContentWidget = {
                    getId: () => `edit-proposal-${proposal.id}`,
                    getDomNode: () => widgetNode,
                    getPosition: () => ({
                        position: { lineNumber: firstOp.start_line + lineOffset, column: 1 },
                        preference: [monacoRef.current!.editor.ContentWidgetPositionPreference.EXACT],
                    }),
                };

                editorRef.current.addContentWidget(widget);
                widgetsRef.current.push(widget);
            }

            const sortedOps = [...(proposal.operations || [])].sort((a, b) => a.start_line - b.start_line);

            sortedOps.forEach((op) => {
                if (op.type === "delete") {
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset,
                            1,
                            op.end_line + lineOffset,
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: "line-decoration-delete",
                            linesDecorationsClassName: "line-decoration-glyph-delete",
                            inlineClassName: "text-decoration-line-through",
                            minimap: {
                                color: "#fca5a5",
                                position: 2,
                            },
                        },
                    });
                } else if (op.type === "insert" && op.new_text) {
                    const newLineCount = op.new_text.split("\n").length;
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset,
                            1,
                            op.start_line + lineOffset + newLineCount - 1,
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: "line-decoration-insert",
                            linesDecorationsClassName: "line-decoration-glyph-insert",
                            minimap: {
                                color: "#86efac",
                                position: 2,
                            },
                        },
                    });
                    lineOffset += newLineCount;
                } else if (op.type === "replace" && op.new_text) {
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.start_line + lineOffset,
                            1,
                            op.end_line + lineOffset,
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: "line-decoration-delete",
                            linesDecorationsClassName: "line-decoration-glyph-delete",
                            inlineClassName: "text-decoration-line-through",
                            minimap: {
                                color: "#fca5a5",
                                position: 2,
                            },
                        },
                    });

                    const newLineCount = op.new_text.split("\n").length;
                    decorations.push({
                        range: new monacoRef.current.Range(
                            op.end_line + lineOffset + 1,
                            1,
                            op.end_line + lineOffset + newLineCount,
                            Number.MAX_VALUE
                        ),
                        options: {
                            isWholeLine: true,
                            className: "line-decoration-insert",
                            linesDecorationsClassName: "line-decoration-glyph-insert",
                            minimap: {
                                color: "#86efac",
                                position: 2,
                            },
                        },
                    });
                    lineOffset += newLineCount;
                }
            });
        });

        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations);
    }, [pendingProposals, onAcceptProposal, onRejectProposal, displayContent]);

    return {
        displayContent,
        editorRef,
        monacoRef,
    };
};
