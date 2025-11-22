export const EditorWorkspace = () => {
  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Active File</p>
          <p className="text-base font-semibold text-text-primary">main.tex</p>
        </div>
        <div className="text-xs text-text-secondary">
          Autosave · <span className="text-emerald-600 font-medium">Saved moments ago</span>
        </div>
      </header>
      <div className="mt-4 flex-1 rounded-xl border border-dashed border-border-soft bg-surface-panel p-4 text-sm text-text-primary">
        Monaco-based LaTeX editor placeholder. Debounced autosave, unsaved-change flushing, and rich
        keybindings will live here.
      </div>
    </section>
  )
}

