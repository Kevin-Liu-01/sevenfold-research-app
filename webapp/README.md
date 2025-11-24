# Sevenfold Webapp Scaffold

Barebones Vite + React starter configured with Tailwind and a domain-aligned scaffolding that mirrors the Sevenfold PRD. The UI currently renders the triptych project view with solid-color panes, state toggles, and descriptive placeholders so each bounded context has a clear home.

## Getting Started

```bash
pnpm install
pnpm dev
```

Tailwind v4 runs through the official `@tailwindcss/vite` plugin. All utilities come from the `@import "tailwindcss";` directive inside `src/app/globals.css`, so no PostCSS config is required.

## Directory Map

```
src/
  app/                # Composition root + pane routers
    SevenfoldApp.tsx
    panes/
      LeftPane.tsx
      CenterPane.tsx
      RightPane.tsx
    globals.css
  modules/            # DDD-inspired slices from the PRD
    projects/ProjectContextBar.tsx
    fileExplorer/FileTreePanel.tsx
    library/LibraryPanel.tsx
    editorWorkspace/EditorWorkspace.tsx
    compilePreview/CompilePreviewPanel.tsx
    pdfViewer/PdfViewerPane.tsx
    agents/...        # Synthesis + Review panes
  shared/
    components/layout/TriptychShell.tsx
    components/ui/PaneToggleGroup.tsx
    state/appStore.ts
    types/domain.ts
```

Each module renders a placeholder that explains the final responsibility (e.g., autosave editor, RAG chat, indexing states). Buttons in every pane switch between the relevant modes (Files/Library, Writing/Reading, Synthesis/Review) to demonstrate layout wiring.

## Next Steps

- Replace placeholders with real API calls to the FastAPI backend described in the PRD.
- Expand the Zustand store to model project/file state, compilation metadata, and chat histories.
- Drop Tailwind utility colors once visual design is ready—each pane is a solid color for now to keep focus on layout validation.
