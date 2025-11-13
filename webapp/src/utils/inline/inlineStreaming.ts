import { useState, useRef, useCallback, useEffect } from "react";
import type { OnMount } from "@monaco-editor/react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 as uuidv4 } from "uuid";
import supabase from "../../auth/supabaseClient";
import { setupInlineProvider } from "./inlineProvider";
import {
  attachInlineKeybindings,
  shouldTriggerAfterSpace,
} from "./inlineTriggers";

type MonacoEditor = Parameters<OnMount>[0];
type SuggestionShape = {
  text: string;
};

export type CompletionState = "idle" | "requesting" | "streaming" | "shown";
export type CompletionTrigger = "idle" | "provider";

const PUNCTUATION_AFTER_SPACE = new Set([".", "?", "!", ";", ":", ")", "]", "}", "$"]);
const CITATION_SUPPRESS_REGEX = /\\(cite|parencite|ref|footnote)\{[^}]*$/;
const EMPTY_SUGGESTION: SuggestionShape = { text: "" };
const PROVIDER_DEBOUNCE_MS = 500;
const AFTER_CONTEXT_WINDOW = 1000;

interface UseInlineStreamingArgs {
  mode: "docx" | "latex" | "markdown";
  compositionId?: string | null;
}

export const useInlineStreaming = ({ mode, compositionId }: UseInlineStreamingArgs) => {
  const editorRef = useRef<MonacoEditor | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const startCompletionRef = useRef<((trigger: CompletionTrigger) => void) | null>(null);
  const inlineProviderRef = useRef<{ refresh(): void; dispose(): void } | null>(null);
  const suggestionDeferredRef = useRef<{
    promise: Promise<SuggestionShape>;
    resolve(value: SuggestionShape): void;
  }>({
    promise: Promise.resolve(EMPTY_SUGGESTION),
    resolve: () => {},
  });
  const editorDisposablesRef = useRef<Array<{ dispose(): void }>>([]);
  const lastProviderRequestTimeRef = useRef(0);
  const providerDebounceTimeoutRef = useRef<number | null>(null);

  const [ghostText, setGhostText] = useState("");
  const ghostTextRef = useRef("");
  const pendingCompletionRef = useRef("");
  const completionStateRef = useRef<CompletionState>("idle");
  const [completionState, setCompletionState] = useState<CompletionState>("idle");

  const updateCompletionState = useCallback((next: CompletionState) => {
    completionStateRef.current = next;
    setCompletionState(next);
  }, [setCompletionState]);
  const beginSuggestionWait = useCallback(() => {
    let resolve!: (value: SuggestionShape) => void;
    const promise = new Promise<SuggestionShape>((res) => {
      resolve = res;
    });
    suggestionDeferredRef.current = { promise, resolve };
  }, []);

  const fulfillSuggestion = useCallback((value: SuggestionShape) => {
    suggestionDeferredRef.current.resolve(value);
    suggestionDeferredRef.current = {
      promise: Promise.resolve(value),
      resolve: () => {},
    };
  }, []);

  const requestSuggestionForProvider = useCallback(() => {
    if (completionStateRef.current === "idle") {
      const now = Date.now();
      const elapsed = now - lastProviderRequestTimeRef.current;
      const trigger = () => {
        lastProviderRequestTimeRef.current = Date.now();
        providerDebounceTimeoutRef.current = null;
        void startCompletionRef.current?.("provider");
      };
      if (elapsed >= PROVIDER_DEBOUNCE_MS) {
        trigger();
      } else {
        if (providerDebounceTimeoutRef.current !== null) {
          window.clearTimeout(providerDebounceTimeoutRef.current);
        }
        providerDebounceTimeoutRef.current = window.setTimeout(
          trigger,
          PROVIDER_DEBOUNCE_MS - elapsed
        );
      }
    }
    return suggestionDeferredRef.current.promise;
  }, []);

  const sendAbortRequest = useCallback(async (requestId: string) => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.access_token) return;
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/compose/complete/abort`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
    } catch (abortError) {
      console.warn("Failed to abort completion", abortError);
    }
  }, []);

  const cancelActiveStream = useCallback(
    (_reason: string, notifyServer = true) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const requestId = activeRequestIdRef.current;
      if (notifyServer && requestId) {
        void sendAbortRequest(requestId);
      }
      activeRequestIdRef.current = null;
      ghostTextRef.current = "";
      setGhostText("");
      pendingCompletionRef.current = "";
      fulfillSuggestion(EMPTY_SUGGESTION);
      updateCompletionState("idle");
    },
    [fulfillSuggestion, sendAbortRequest, updateCompletionState]
  );

  const isInsideSuppressedRegion = useCallback((fullText: string, offset: number) => {
    const recent = fullText.slice(Math.max(0, offset - 200), offset);
    return CITATION_SUPPRESS_REGEX.test(recent);
  }, []);

  const buildContextSlice = useCallback((fullText: string, offset: number) => {
    const maxWindow = 4000;
    const minWindow = 80;
    let start = Math.max(0, offset - maxWindow);
    let beforeSlice = fullText.slice(start, offset);
    if (beforeSlice.length < minWindow) {
      start = Math.max(0, offset - minWindow);
      beforeSlice = fullText.slice(start, offset);
    }
    const afterSlice = fullText.slice(
      offset,
      Math.min(fullText.length, offset + AFTER_CONTEXT_WINDOW)
    );
    return {
      before: beforeSlice,
      after: afterSlice,
    };
  }, []);

  const startCompletion = useCallback(
    async (_trigger: CompletionTrigger) => {
      if (mode !== "latex" || !compositionId) return;
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;

      const offset = model.getOffsetAt(position);
      const fullText = model.getValue();
      if (!fullText || !fullText.length) return;
      if (isInsideSuppressedRegion(fullText, offset)) return;

      const { before, after } = buildContextSlice(fullText, offset);
      if (!before.trim() && !after.trim()) return;

      cancelActiveStream("restart");
      beginSuggestionWait();

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        console.error("Cannot fetch completion without session");
        return;
      }

      // Use crypto.randomUUID when available (browser) but fall back to uuidv4 for SSR/tests where crypto may be undefined.
      const requestId = crypto?.randomUUID?.() ?? uuidv4();
      activeRequestIdRef.current = requestId;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      ghostTextRef.current = "";
      setGhostText("");
      pendingCompletionRef.current = "";
      updateCompletionState("requesting");

      let firstChunkReceived = false;

      const payload = {
        doc_id: compositionId,
        cursor: offset,
        request_id: requestId,
        language: mode,
        context_before: before,
        context_after: after,
      };

      const streamUrl = `${import.meta.env.VITE_API_BASE_URL}/compose/complete`;

      void fetchEventSource(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        openWhenHidden: true,
        onmessage: (event) => {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (event.event === "chunk") {
            if (!firstChunkReceived) {
              firstChunkReceived = true;
              updateCompletionState("streaming");
            }
            if (typeof data.delta === "string" && data.delta.length > 0) {
              pendingCompletionRef.current += data.delta;
            }
          } else if (event.event === "done") {
            abortControllerRef.current = null;
            activeRequestIdRef.current = null;
            const finalSuggestion = pendingCompletionRef.current;
            pendingCompletionRef.current = "";
            if (
              finalSuggestion &&
              !finalSuggestion.trim().includes("_INSUFFICIENT_CONTEXT_")
            ) {
              ghostTextRef.current = finalSuggestion;
              fulfillSuggestion({ text: finalSuggestion });
              setGhostText(finalSuggestion);
              updateCompletionState("shown");
            } else {
              fulfillSuggestion(EMPTY_SUGGESTION);
              ghostTextRef.current = "";
              setGhostText("");
              updateCompletionState("idle");
            }
          } else if (event.event === "error") {
            abortControllerRef.current = null;
            activeRequestIdRef.current = null;
            console.warn("Completion stream error:", data);
            fulfillSuggestion(EMPTY_SUGGESTION);
            cancelActiveStream("error", false);
          }
        },
        onerror: (err) => {
          if (controller.signal.aborted) {
            return;
          }
          console.warn("Completion stream failed:", err);
          fulfillSuggestion(EMPTY_SUGGESTION);
          cancelActiveStream("network", false);
        },
      });
    },
    [
      mode,
      compositionId,
      isInsideSuppressedRegion,
      buildContextSlice,
      beginSuggestionWait,
      fulfillSuggestion,
      cancelActiveStream,
      updateCompletionState,
    ]
  );

  useEffect(() => {
    startCompletionRef.current = startCompletion;
  }, [startCompletion]);

  const handleEditorChange = useCallback(
    (_value?: string, ev?: any) => {
      if (mode !== "latex") return;
      if (!ev) {
        return;
      }

      const editor = editorRef.current;
      const model = editor?.getModel();
      const position = editor?.getPosition();
      if (!editor || !model || !position) {
        return;
      }

      const offset = model.getOffsetAt(position);
      const fullText = model.getValue();
      const insertedText = ev.changes?.[0]?.text ?? "";

      if (completionStateRef.current === "shown" && insertedText) {
        const suggestion = ghostTextRef.current;
        if (suggestion.startsWith(insertedText)) {
          const remaining = suggestion.slice(insertedText.length);
          ghostTextRef.current = remaining;
          setGhostText(remaining);
          if (!remaining.length) {
            updateCompletionState("idle");
          }
          inlineProviderRef.current?.refresh();
          return;
        }
      }

      if (insertedText === " " && completionStateRef.current !== "idle") {
        return;
      }

      if (completionStateRef.current !== "idle") {
        cancelActiveStream("typing");
      }

      if (
        insertedText === " " &&
        shouldTriggerAfterSpace(fullText, offset, PUNCTUATION_AFTER_SPACE, isInsideSuppressedRegion)
      ) {
        if (inlineProviderRef.current) {
          inlineProviderRef.current.refresh();
        }
      }
    },
    [mode, cancelActiveStream, isInsideSuppressedRegion, updateCompletionState]
  );

  const handleEditorMount = useCallback<OnMount>(
    (editor, monacoInstance) => {
      editorRef.current = editor;

      editorDisposablesRef.current.forEach((d) => d.dispose());
      editorDisposablesRef.current = [];
      inlineProviderRef.current?.dispose();
      inlineProviderRef.current = setupInlineProvider(
        monacoInstance,
        ["latex", "plaintext"],
        requestSuggestionForProvider
      );

      const keybindingDisposable = attachInlineKeybindings(editor, {
        onEscape: () => {
          if (completionStateRef.current !== "idle") {
            cancelActiveStream("escape");
            return true;
          }
          return false;
        },
        onAccept: () => {
          if (!ghostTextRef.current) {
            return false;
          }
          editor.trigger("inlineSuggest", "editor.action.inlineSuggest.commit", {});
          ghostTextRef.current = "";
          setGhostText("");
          updateCompletionState("idle");
          cancelActiveStream("accepted");
          return true;
        },
      });

      editorDisposablesRef.current.push(
        keybindingDisposable, 
      );
    },
    [
      cancelActiveStream,
      updateCompletionState,
      requestSuggestionForProvider,
    ]
  );

  useEffect(() => {
    return () => {
      if (providerDebounceTimeoutRef.current !== null) {
        window.clearTimeout(providerDebounceTimeoutRef.current);
        providerDebounceTimeoutRef.current = null;
      }
      editorDisposablesRef.current.forEach((d) => d.dispose());
      editorDisposablesRef.current = [];
      inlineProviderRef.current?.dispose();
      inlineProviderRef.current = null;
      cancelActiveStream("unmount", false);
    };
  }, [cancelActiveStream]);

  useEffect(() => {
    if (mode !== "latex") {
      cancelActiveStream("mode-switch", false);
    }
  }, [mode, cancelActiveStream]);

  useEffect(() => {
    cancelActiveStream("doc-switch", false);
  }, [compositionId, cancelActiveStream]);

  return {
    ghostText,
    completionState,
    handleEditorChange,
    handleEditorMount,
  };
};
