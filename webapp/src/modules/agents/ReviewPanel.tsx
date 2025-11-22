export const ReviewPanel = () => {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Manuscript Review</p>
      <div className="mt-3 flex-1 rounded-xl border border-dashed border-border-soft bg-surface-panel p-4 text-sm text-text-primary">
        Streaming Gemini review output placeholder. Markdown rendering and actionable suggestions
        will populate here.
      </div>
      <button type="button" className="mt-4 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-accent/90">
        Review Current File
      </button>
    </div>
  )
}

