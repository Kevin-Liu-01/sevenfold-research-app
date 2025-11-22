export const CompilePreviewPanel = () => {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Compilation</p>
          <p className="text-base font-semibold text-text-primary">Tectonic · entry file: main.tex</p>
        </div>
        <button type="button" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Compile
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-border-soft bg-surface-panel p-4 text-sm text-text-primary">
        Preview viewport for build logs + compiled PDF blob URL. States for success/failure will tie
        into the store's `isCompiling` flags.
      </div>
    </section>
  )
}

