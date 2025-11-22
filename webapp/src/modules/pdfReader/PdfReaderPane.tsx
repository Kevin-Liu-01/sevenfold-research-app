export const PdfReaderPane = () => {
  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">PDF Reader</p>
          <p className="text-base font-semibold text-text-primary">Compiled manuscript preview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-primary">
          <button type="button" className="ghost-button">
            -
          </button>
          <span className="font-medium">100%</span>
          <button type="button" className="ghost-button">
            +
          </button>
        </div>
      </header>
      <div className="mt-4 flex-1 rounded-xl border border-dashed border-border-soft bg-surface-panel p-4 text-sm text-text-primary">
        `react-pdf` viewport placeholder. Page navigation, zoom controls, and blob management will
        sit here per the PRD.
      </div>
    </section>
  )
}

