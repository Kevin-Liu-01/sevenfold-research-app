const libraryDocs = [
  { id: 'lib-1', title: 'Smith 2023 - Transformer Survey', status: 'Indexed' },
  { id: 'lib-2', title: 'Jones 2021 - Latex Workflows', status: 'Indexing' },
  { id: 'lib-3', title: 'Wang 2019 - RAG Evaluation', status: 'Needs retry' },
]

export const LibraryPanel = () => {
  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Library</p>
          <p className="text-base font-semibold text-text-primary">Per-project PDFs</p>
        </div>
        <button type="button" className="ghost-button">
          Upload PDF
        </button>
      </header>
      <ul className="space-y-3 overflow-y-auto">
        {libraryDocs.map((doc) => (
          <li key={doc.id} className="rounded-xl border border-border-soft bg-surface-contrast px-3 py-2 transition-colors hover:border-border-medium">
            <p className="font-medium text-text-primary">{doc.title}</p>
            <p className="text-xs uppercase tracking-wide text-text-muted mt-1">{doc.status}</p>
          </li>
        ))}
      </ul>
      <div className="mt-auto text-xs text-text-secondary">
        Upload flow mirrors Flow A from the PRD, with indexing states surfaced inline.
      </div>
    </div>
  )
}

