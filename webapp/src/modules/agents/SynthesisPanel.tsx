const sampleResponses = [
  {
    id: 'chat-1',
    prompt: 'Summarize the related work around multimodal transformers.',
    response: 'Gemini would respond here with citations to indexed PDFs.',
  },
]

export const SynthesisPanel = () => {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">RAG Synthesis</p>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto text-sm">
        {sampleResponses.map((item) => (
          <article key={item.id} className="rounded-xl border border-border-soft bg-surface-panel p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Prompt</p>
            <p className="font-semibold text-text-primary mt-1">{item.prompt}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Response</p>
            <p className="text-text-primary mt-1">{item.response}</p>
          </article>
        ))}
      </div>
      <button type="button" className="mt-4 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-accent/90">
        Ask Gemini
      </button>
    </div>
  )
}

