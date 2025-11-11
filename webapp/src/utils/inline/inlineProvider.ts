import type { OnMount } from "@monaco-editor/react";

type Monaco = Parameters<OnMount>[1];

interface SuggestionShape {
    text: string;
    anchor: { lineNumber: number; column: number } | null;
}

interface InlineProviderControls {
    refresh(): void;
    dispose(): void;
}

export const setupInlineProvider = (
    monacoInstance: Monaco,
    languages: string[],
    getSuggestion: () => SuggestionShape
): InlineProviderControls => {
    const emitter = new monacoInstance.Emitter<void>();

    const disposable = monacoInstance.languages.registerInlineCompletionsProvider(languages, {
        displayName: "StreamingProvider",
        onDidChangeInlineCompletions: emitter.event,
        provideInlineCompletions(_model, position) {
            const { text, anchor } = getSuggestion();
            if (
                !text ||
                !anchor ||
                position.lineNumber !== anchor.lineNumber ||
                position.column < anchor.column
            ) {
                return { items: [], dispose() {} };
            }

            const range = new monacoInstance.Range(
                anchor.lineNumber,
                anchor.column,
                anchor.lineNumber,
                anchor.column
            );

            return {
                items: [
                    {
                        insertText: text,
                        range,
                        command: undefined,
                    },
                ],
                enableForwardStability: true,
                dispose() {},
            };
        },
        handlePartialAccept() { },
        disposeInlineCompletions() {},
    });

    return {
        refresh: () => {
            emitter.fire();
        },
        dispose: () => {
            disposable.dispose();
            emitter.dispose();
        },
    };
};
