import type { FileNode } from '@/shared/types/domain'

const mockTree: FileNode[] = [
  { id: 'root-1', name: 'main.tex', depth: 0, fileType: 'latex' },
  { id: 'root-2', name: 'sections/', depth: 0, fileType: 'folder' },
  { id: 'child-2a', name: '01-introduction.tex', depth: 1, fileType: 'latex' },
  { id: 'child-2b', name: '02-methods.tex', depth: 1, fileType: 'latex' },
  { id: 'root-3', name: 'figures/', depth: 0, fileType: 'folder' },
  { id: 'child-3a', name: 'architecture.png', depth: 1, fileType: 'asset' },
]

const typeToColor: Record<FileNode['fileType'], string> = {
  folder: 'text-amber-700',
  latex: 'text-emerald-700',
  pdf_source: 'text-rose-700',
  asset: 'text-sky-700',
}

export const FileTreePanel = () => {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">File Tree</p>
      <ul className="mt-3 space-y-2">
        {mockTree.map((node) => (
          <li
            key={node.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-contrast ${typeToColor[node.fileType]}`}
            style={{ marginLeft: `${node.depth * 12}px` }}
          >
            <span className="text-text-primary group-hover:text-accent font-medium">{node.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-xl border border-dashed border-border-soft p-3 text-xs text-text-secondary">
        Drag-and-drop, context menus, and depth enforcement will live here per the PRD file system
        rules.
      </div>
    </div>
  )
}

