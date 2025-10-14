# Sevenfold Web App

The main Sevenfold application built with React and Vite, deployed on the `app` subdomain.

This is the core product where researchers interact with their projects, papers, annotations, and compositions. Built with React 19 + Vite for fast development and optimal runtime performance.

## Architecture

### Auth

All components are wrapped in an auth provider that manages user session and data via Supabase Auth. The auth context is accessible throughout the app.

### Workbench & Context

The workbench is the primary interface once a user selects a project. It uses a `WorkbenchContext` that is shared between the sidebar and viewer components to manage:

- Current project state
- Selected papers
- Active viewer
- Sidebar state (open/closed, selected tab)

This context pattern enables seamless state synchronization across the interface without prop drilling.

### Viewers

Rather than using traditional routing between pages, the workbench displays different "viewers" that represent different modes of the research workflow. Viewers are swapped in and out of the main content area without unmounting the workbench or sidebar.

Available viewers:

- **Library Viewer** (`src/viewers/library/`): Browse and organize papers in the current project
- **Reader Viewer** (`src/viewers/reader/`): Read and annotate PDFs with highlights and notes
- **Composition Viewer** (`src/viewers/composition/`): Write papers in Markdown or LaTeX with live preview
- **Search Viewer** (`src/viewers/search/`): Search the public corpus and add papers to the project

This approach allows for:
- Instant transitions between views (no page reload or route change)
- Persistent sidebar state across viewer changes
- Shared context between viewers (e.g., currently selected paper)

### Sidebar

The sidebar (`src/sidebar/`) contains tabs for different aspects of project management (papers, annotations, compositions, etc.) and stays mounted across all viewer changes. It communicates with viewers via the `WorkbenchContext`.
