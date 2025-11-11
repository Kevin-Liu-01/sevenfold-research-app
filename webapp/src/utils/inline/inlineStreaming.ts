import { useState, useRef, useCallback, useEffect } from "react";
import type { OnMount } from "@monaco-editor/react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 as uuidv4 } from "uuid";
import supabase from "../../auth/supabaseClient";
import { setupInlineProvider } from "./inlineProvider";
import {
  attachInlineKeybindings,
  createIdleScheduler,
  shouldTriggerAfterSpace,
} from "./inlineTriggers";

type MonacoEditor = Parameters<OnMount>[0];

export type CompletionState = "idle" | "requesting" | "streaming" | "shown";
export type CompletionTrigger = "idle" | "punctuation" | "manual";

const PUNCTUATION_AFTER_SPACE = new Set([".", "?", "!", ";", ":", ")", "]", "}", "$"]);
const CITATION_SUPPRESS_REGEX = /\\(cite|parencite|ref|footnote)\{[^}]*$/;

interface UseInlineStreamingArgs {
  mode: "docx" | "latex" | "markdown";
  compositionId?: string | null;
}

export const useInlineStreaming = ({ mode, compositionId }: UseInlineStreamingArgs) => {
  const editorRef = useRef<MonacoEditor | null>(null);
  const anchorPositionRef = useRef<{ lineNumber: number; column: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const startCompletionRef = useRef<((trigger: CompletionTrigger) => void) | null>(null);
  const inlineProviderRef = useRef<{ refresh(): void; dispose(): void } | null>(null);
  const editorDisposablesRef = useRef<Array<{ dispose(): void }>>([]);
  const idleScheduler = useRef(createIdleScheduler(() => startCompletionRef.current?.("idle"), 250));

  const [ghostText, setGhostText] = useState("");
  const ghostTextRef = useRef("");
  const pendingCompletionRef = useRef("");
  const completionStateRef = useRef<CompletionState>("idle");
  const [completionState, setCompletionState] = useState<CompletionState>("idle");

  const updateCompletionState = useCallback((next: CompletionState) => {
    completionStateRef.current = next;
    setCompletionState(next);
  }, []);

  const clearIdleTimer = useCallback(() => {
    idleScheduler.current.clear();
  }, []);

  const scheduleIdleTrigger = useCallback(() => {
    if (mode !== "latex") return;
    idleScheduler.current.schedule();
  }, [mode]);

  const refreshInlineCompletions = useCallback(() => {
    inlineProviderRef.current?.refresh();
  }, []);

  const refreshInlineSuggest = useCallback(
    (forceTrigger = false) => {
      const controller = editorRef.current?.getContribution(
        "editor.contrib.inlineSuggestController"
      ) as { forceUpdate?(): void } | undefined;
      controller?.forceUpdate?.();
      if (forceTrigger) {
        editorRef.current?.trigger("inlineSuggest", "editor.action.inlineSuggest.trigger", {});
      }
    },
    []
  );

  const triggerInlineCompletionModel = useCallback(() => {
    const controller = editorRef.current?.getContribution(
      "editor.contrib.inlineCompletionsController"
    ) as
      | {
        model?: {
          get?(): {
            trigger?(tx?: unknown, options?: { noDelay?: boolean }): Promise<void>;
          } | null;
        };
      }
      | undefined;
    const model = controller?.model?.get?.();
    if (model?.trigger) {
      console.log("Triggering inline completion model");
      void model.trigger(undefined, { noDelay: true });
    }
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
      clearIdleTimer();
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
      refreshInlineCompletions();
      anchorPositionRef.current = null;
      updateCompletionState("idle");
    },
    [clearIdleTimer, refreshInlineCompletions, sendAbortRequest, updateCompletionState]
  );

  const isInsideSuppressedRegion = useCallback((fullText: string, offset: number) => {
    const recent = fullText.slice(Math.max(0, offset - 200), offset);
    return CITATION_SUPPRESS_REGEX.test(recent);
  }, []);

  const buildContextSlice = useCallback((fullText: string, offset: number) => {
    const maxWindow = 4000;
    const minWindow = 80;
    let start = Math.max(0, offset - maxWindow);
    let slice = fullText.slice(start, offset);
    if (slice.length < minWindow) {
      start = Math.max(0, offset - minWindow);
      slice = fullText.slice(start, offset);
    }
    return slice;
  }, []);

  const startCompletion = useCallback(
    async (_trigger: CompletionTrigger) => {
      if (mode !== "latex" || !compositionId) return;
      clearIdleTimer();
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;

      const offset = model.getOffsetAt(position);
      const fullText = model.getValue();
      if (!fullText || !fullText.length) return;
      if (isInsideSuppressedRegion(fullText, offset)) return;

      const contextSlice = buildContextSlice(fullText, offset);
      if (!contextSlice.trim()) return;

      cancelActiveStream("restart");
      anchorPositionRef.current = { lineNumber: position.lineNumber, column: position.column };

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        console.error("Cannot fetch completion without session");
        return;
      }

      const requestId = crypto?.randomUUID?.() ?? uuidv4();
      activeRequestIdRef.current = requestId;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      ghostTextRef.current = "";
      setGhostText("");
      pendingCompletionRef.current = "";
      refreshInlineCompletions();
      updateCompletionState("requesting");
      console.log("Starting completion request; reason:", _trigger);

      let firstChunkReceived = false;

      const payload = {
        doc_id: compositionId,
        cursor: offset,
        request_id: requestId,
        language: mode,
        context: contextSlice,
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
            if (finalSuggestion) {
              console.log("Setting completed suggestion:", finalSuggestion);
              ghostTextRef.current = finalSuggestion;
              setGhostText(finalSuggestion);
              refreshInlineCompletions();
              triggerInlineCompletionModel();
              refreshInlineSuggest(true);
              updateCompletionState("shown");
            } else {
              ghostTextRef.current = "";
              setGhostText("");
              updateCompletionState("idle");
            }
          } else if (event.event === "error") {
            abortControllerRef.current = null;
            activeRequestIdRef.current = null;
            console.warn("Completion stream error:", data);
            cancelActiveStream("error", false);
          }
        },
        onerror: (err) => {
          if (controller.signal.aborted) {
            return;
          }
          console.error("Completion stream failed:", err);
          cancelActiveStream("network", false);
        },
      });
    },
    [
      mode,
      compositionId,
      clearIdleTimer,
      isInsideSuppressedRegion,
      buildContextSlice,
      cancelActiveStream,
      refreshInlineCompletions,
      triggerInlineCompletionModel,
      refreshInlineSuggest,
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
        scheduleIdleTrigger();
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
          const anchor = anchorPositionRef.current;
          if (anchor) {
            anchorPositionRef.current = {
              lineNumber: position.lineNumber,
              column: position.column,
            };
          }
          refreshInlineCompletions();
          triggerInlineCompletionModel();
          if (!remaining.length) {
            updateCompletionState("idle");
            scheduleIdleTrigger();
          }
          return;
        }
      }

      if (insertedText === " " && completionStateRef.current !== "idle") {
        return;
      }

      if (completionStateRef.current !== "idle") {
        cancelActiveStream("typing");
      } else {
        clearIdleTimer();
      }

      if (
        insertedText === " " &&
        shouldTriggerAfterSpace(fullText, offset, PUNCTUATION_AFTER_SPACE, isInsideSuppressedRegion)
      ) {
        void startCompletionRef.current?.("punctuation");
      } else {
        scheduleIdleTrigger();
      }
    },
    [mode, scheduleIdleTrigger, cancelActiveStream, clearIdleTimer, isInsideSuppressedRegion]
  );

  const handleEditorMount = useCallback<OnMount>(
    (editor, monacoInstance) => {
      editorRef.current = editor;

      editorDisposablesRef.current.forEach((d) => d.dispose());
      editorDisposablesRef.current = [];
      inlineProviderRef.current?.dispose();
      inlineProviderRef.current = setupInlineProvider(monacoInstance, ["latex", "plaintext"], () => ({
        text: ghostTextRef.current,
        anchor: anchorPositionRef.current,
      }));

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
          refreshInlineCompletions();
          anchorPositionRef.current = null;
          updateCompletionState("idle");
          cancelActiveStream("accepted");
          scheduleIdleTrigger();
          return true;
        },
      });

      // schedule idle trigger on user cursor movement
      // const cursorDisposable = attachCursorListener(editor, (userInitiated) => {
      //   if (userInitiated && completionStateRef.current !== "idle") {
      //     cancelActiveStream("cursor");
      //   }
      //   if (userInitiated) {
      //     scheduleIdleTrigger();
      //   }
      // });

      editorDisposablesRef.current.push(
        keybindingDisposable, 
        // cursorDisposable
      );
    },
    [
      cancelActiveStream,
      refreshInlineCompletions,
      scheduleIdleTrigger,
      updateCompletionState,
    ]
  );

  useEffect(() => {
    return () => {
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
