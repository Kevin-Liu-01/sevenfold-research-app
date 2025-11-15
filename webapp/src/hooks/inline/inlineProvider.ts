import type { OnMount } from "@monaco-editor/react";

type Monaco = Parameters<OnMount>[1];

type SuggestionShape = {
    text: string;
};

interface InlineProviderControls {
    refresh(): void;
    dispose(): void;
}

export const setupInlineProvider = (
    monacoInstance: Monaco,
    languages: string[],
    getSuggestion: () => Promise<SuggestionShape>
): InlineProviderControls => {
    const emitter = new monacoInstance.Emitter<void>();

    const disposable = monacoInstance.languages.registerInlineCompletionsProvider(languages, {
        displayName: "StreamingProvider",
        onDidChangeInlineCompletions: emitter.event,
        provideInlineCompletions: async (_model, position) => {
            const { text } = await getSuggestion();
            const range = new monacoInstance.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
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
