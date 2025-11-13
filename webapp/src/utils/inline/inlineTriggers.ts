import type { OnMount } from "@monaco-editor/react";

type MonacoEditor = Parameters<OnMount>[0];

export interface KeybindingHandlers {
    onEscape(): boolean | void;
    onAccept(): boolean | void;
}

export const createIdleScheduler = (callback: () => void, delayMs = 250) => {
    let timer: number | null = null;

    const clear = () => {
        if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
        }
    };

    const schedule = () => {
        clear();
        timer = window.setTimeout(callback, delayMs);
    };

    return { schedule, clear };
};

export const attachInlineKeybindings = (editor: MonacoEditor, handlers: KeybindingHandlers) =>
    editor.onKeyDown((e) => {
        if (e.code === "Escape") {
            const handled = handlers.onEscape();
            if (handled !== false) {
                e.preventDefault();
            }
        }
        if (e.code === "Tab") {
            const handled = handlers.onAccept();
            if (handled !== false) {
                e.preventDefault();
            }
        }
    });

export const attachCursorListener = (
    editor: MonacoEditor,
    onUserCursor: (userInitiated: boolean) => void
) =>
    editor.onDidChangeCursorPosition((e) => {
        const userInitiated = e.source === "keyboard" || e.source === "mouse";
        onUserCursor(userInitiated);
    });

export const shouldTriggerAfterSpace = (
    fullText: string,
    offset: number,
    punctuationAfterSpace: Set<string>,
    isSuppressed: (full: string, index: number) => boolean
) => {
    if (offset < 2) return false;
    const prevChar = fullText.charAt(offset - 2);
    if (!punctuationAfterSpace.has(prevChar)) {
        return false;
    }
    return !isSuppressed(fullText, offset);
};
