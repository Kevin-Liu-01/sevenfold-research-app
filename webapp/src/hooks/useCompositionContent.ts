import { useCallback, useEffect, useRef, useState } from "react";
import type { Composition } from "../../../schema/db-types";
import { marked } from "marked";
import { useInlineStreaming } from "./inline/inlineStreaming";
import { fetchComposition, updateComposition } from "../api/compose";

interface UseCompositionContentArgs {
    selectedComposition: Composition | null;
    refreshCompositions: () => void;
}

// Handles loading, rendering, and autosaving of the active composition.
export const useCompositionContent = ({
    selectedComposition,
    refreshCompositions,
}: UseCompositionContentArgs) => {
    const [mode, setMode] = useState<"docx" | "latex" | "markdown">(
        (selectedComposition?.type as "docx" | "latex" | "markdown") || "latex"
    );
    const [content, setContent] = useState(selectedComposition?.contents || "");
    const [title, setTitle] = useState(selectedComposition?.title || "Untitled");
    const [compileCounter, setCompileCounter] = useState(0);
    const [renderedHtml, setRenderedHtml] = useState("");
    const isInitialLoad = useRef(true);

    const { handleEditorChange, handleEditorMount } = useInlineStreaming({
        mode,
        compositionId: selectedComposition?.id,
    });

    const handleLatexEditorChange = useCallback(
        (value?: string, ev?: Parameters<typeof handleEditorChange>[1]) => {
            setContent(value || "");
            handleEditorChange(value, ev);
        },
        [handleEditorChange]
    );

    const incrementCompileCounter = useCallback(() => {
        setCompileCounter((counter) => counter + 1);
    }, []);

    useEffect(() => {
        if (selectedComposition) {
            setMode(selectedComposition.type as "docx" | "latex" | "markdown");
            setContent(selectedComposition.contents || "");
            setTitle(selectedComposition.title || "Untitled");
            isInitialLoad.current = true;
        } else {
            setContent("");
            setTitle("Untitled");
        }
    }, [
        selectedComposition?.contents,
        selectedComposition?.id,
        selectedComposition?.title,
        selectedComposition?.type,
    ]);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (mode === "markdown") {
                const html = await marked.parse(content, {
                    gfm: true,
                    breaks: true,
                });
                setRenderedHtml(html);
            } else {
                setRenderedHtml("");
            }
        }, 300);
        return () => clearTimeout(t);
    }, [content, mode]);

    useEffect(() => {
        if (!selectedComposition?.id) return;
        (async () => {
            try {
                const data = await fetchComposition(selectedComposition.id);
                setContent(data.contents || "");
                setTitle(data.title || "Untitled");
                setMode(data.type as "docx" | "latex" | "markdown");
            } catch (error) {
                console.error("Failed to load composition:", error);
            }
        })();
    }, [selectedComposition?.id]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }
            (async () => {
                if (!selectedComposition?.id) return;
                try {
                    await updateComposition(selectedComposition.id, {
                        contents: content,
                        title,
                        type: mode,
                    });
                    refreshCompositions();
                } catch (error) {
                    console.error("Failed to save composition:", error);
                }
            })();
        }, 1000);
        return () => clearTimeout(t);
    }, [content, title, mode, selectedComposition?.id, refreshCompositions]);

    return {
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
    };
};
