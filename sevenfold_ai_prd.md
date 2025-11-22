# Product Requirements Document (PRD)  
**Product:** Sevenfold Web Platform (MVP)  
**Version:** 1.2 – Engineering Handoff (DDD + Org Included)  
**Target Platform:** Desktop Web Application (Local Dev, Single User)  

---

## 0. Overview

### 0.1. Product Summary

Sevenfold is an integrated academic research environment that combines:

- Project-based LaTeX writing
- PDF library management and reading
- Context-aware AI assistance (RAG and manuscript review)

All within a single “triptych” layout: file tree, central editor/reader, and an AI/utility pane.

### 0.2. Primary Goal (MVP)

Build a functional **single-user** MVP that supports the following complete workflow:

1. Create a project.
2. Upload academic papers (PDFs) into a per-project library.
3. Write LaTeX within that project, using a file tree.
4. Compile the LaTeX into a PDF via Tectonic.
5. View the compiled PDF in a preview pane.
6. Chat with:
    - Uploaded PDFs (via RAG).
    - LaTeX manuscript content (via review agent).

### 0.3. Target User (MVP)

- Power user: the founder / engineer on a **single local machine**.
- No multi-user, no auth, no organizations in MVP.
- Architecture should be future-proof for multi-user and remote hosting, but not implemented now.

### 0.4. In-Scope (Phase 1)

- Single local user with multiple projects.
- Per-project PDF library.
- File tree with nested folders (max depth 4).
- LaTeX editing with autosave.
- Tectonic compilation via FastAPI.
- PDF reading (page navigation + zoom).
- RAG-based chat over per-project PDFs.
- Manuscript review agent over provided LaTeX content.
- Streaming responses for AI agents.
- DDD-inspired backend structure, with clear domains and layers.
- Health checks and seed data for local dev.

### 0.5. Explicit Non-Goals (Phase 1)

- Authentication, sign-up, or multi-user access control.
- Real-time collaboration.
- Cross-project semantic search.
- Complex PDF annotations (highlights, comments) in the UI.
- Rich citation management or BibTeX tooling beyond raw LaTeX.
- User-facing settings/preferences panel.
- Analytics or telemetry.

---

## 1. System Architecture and Global Concepts

### 1.1. High-Level Tech Stack

| Component            | Technology                          | Responsibility                                           | Notes                                     |
| :------------------- | :---------------------------------- | :------------------------------------------------------ | :---------------------------------------- |
| Frontend             | React + Vite                        | UI rendering, user interactions, client state           | Must not talk to DB directly              |
| State Management     | Zustand                             | Cross-pane/global state, triptych coordination          | Single global store                       |
| Backend API          | FastAPI (Python 3.10+)              | Business logic, file I/O, compilation, AI orchestration | Source of truth for all data              |
| DB (Metadata)        | PostgreSQL (local) + SQLModel       | User, projects, files, settings                         | Single-user but schema multi-tenant ready |
| DB (Vector)          | ChromaDB (local, persistent)        | Embeddings store for PDF chunks                         | Per-project collections / partitioning    |
| File Storage         | Local filesystem                    | Raw PDFs, LaTeX files, assets                           | Mimics future S3 layout                   |
| LaTeX Engine         | Tectonic                            | Compile LaTeX to PDF                                    | Invoked as subprocess                     |
| AI LLM               | Gemini API                          | Text generation (synthesis, review)                     | Streaming required                        |
| Embeddings           | `sentence-transformers` (local CPU) | Query and document embeddings for RAG                   | E.g. `all-MiniLM-L6-v2`                   |

Frontend talks only to the FastAPI backend.  
Backend talks to Postgres, ChromaDB, filesystem, Tectonic, and Gemini.

---

### 1.2. Domain-Driven Design (DDD) and Bounded Contexts

The backend MUST be organized around domains, not just technical layers.

#### 1.2.1. Bounded Contexts

1. **User and Projects Context**
    - Entities:
        - `User` (single local user in MVP).
        - `Project`.
    - Responsibilities:
        - Create/list/delete projects.
        - Track project metadata (name, created_at).
        - Track project entry file (for compilation).

2. **File System Context**
    - Entities:
        - `File` (aggregate root under a `Project`).
        - `FileType` (`FOLDER`, `LATEX`, `PDF_SOURCE`, `ASSET`).
    - Responsibilities:
        - Maintain hierarchical file tree per project.
        - Enforce maximum nesting depth: **4 levels**.
        - Operations: create, rename, move, delete, read/write file content.
    - Rule:
        - Folder and file structure on disk mirrors logical file tree.
        - No reserved folder names enforced at the domain level.

3. **Compilation Context**
    - Entities:
        - `CompilationJob`.
        - `CompilationResult` (success with PDF bytes, or failure with logs).
    - Responsibilities:
        - Given project and entry file, compile via Tectonic.
        - Manage temp directories, incremental behavior, logs.
    - Behavior:
        - Uses a unique temp directory per job.
        - Copies the entire project file tree into temp dir before compilation.
        - Returns logs and compiled PDF.

4. **Library and Indexing (RAG) Context**
    - Entities:
        - `LibraryDocument` (backed by `File` with `file_type = PDF_SOURCE`).
        - `IndexingJob`.
    - Responsibilities:
        - Manage per-project library PDFs.
        - Extract, chunk, embed, and index PDF text into ChromaDB.
    - Rules:
        - **PDFs are immutable** in MVP.
        - Indexing is scoped strictly to `project_id`.
        - Failed indexing jobs are visible to the user, who can retry.

5. **Agents and Chat Context**
    - Entities:
        - `SynthesisQuery`.
        - `ReviewRequest`.
    - Responsibilities:
        - Orchestrate Gemini calls for:
            - RAG-based synthesis over project PDFs.
            - Review of LaTeX manuscripts.
    - Rules:
        - RAG queries are always restricted to a single `project_id`.
        - Responses must be streamed to the frontend.

---

### 1.3. Runtime Topology (Local Dev)

- Mixed setup is acceptable:
    - FastAPI app (backend) running locally (possibly in a venv).
    - PostgreSQL via local install or Docker container.
    - ChromaDB running in-process or local service.
    - Frontend running via Vite dev server.
- No need for Kubernetes or cloud infra for MVP, but design is container-friendly.

---

### 1.4. Data Flow Diagrams

#### 1.4.1. Flow A: PDF Upload and Indexing (RAG Prep)

1. Frontend (Library / File Tree pane):
    - User selects `Upload PDF` under a project.
    - Sends `POST /api/projects/{project_id}/upload-pdf` with `multipart/form-data`.
2. FastAPI:
    - Validates `project_id`.
    - Saves file to:
        - `local_storage_root/projects/{project_uuid}/library_pdfs/{filename}`.
    - Creates `File` record in DB:
        - `file_type = PDF_SOURCE`.
        - `relative_path` pointing to stored file.
        - `is_indexed = false`.
3. FastAPI (Background Task):
    - Extracts text from PDF.
    - Splits into chunks (e.g. 500 tokens, overlap 50).
    - Embeds each chunk using local `sentence-transformers`.
    - Upserts into ChromaDB with metadata:
        - `project_id`, `file_id`, `page_range`, `chunk_index`.
    - On success, sets `file.is_indexed = true`.
    - On failure, records error state (e.g. `indexing_failed = true` in metadata or separate table).
4. Frontend:
    - Shows “upload success” immediately.
    - Shows indexing status (`Not indexed → Indexing… → Indexed` or `Indexing failed`).
    - Allows explicit “Retry indexing” action which calls a reindex endpoint.

#### 1.4.2. Flow B: LaTeX Compilation

1. Frontend (Editor pane):
    - User selects entry file (via UI control) and clicks **Compile**.
    - Sends `POST /api/projects/{project_id}/compile` with payload:
        - `{ "entry_file_id": "<uuid>" }`.
2. FastAPI:
    - Resolves project and entry file, verifies `file_type = LATEX`.
    - Creates temp dir: `/tmp/compile_job_{uuid}/`.
    - Copies the entire project tree from local storage into temp dir.
    - Invokes `tectonic main.tex` or the chosen entry `.tex` file.
    - Captures `stdout` and `stderr`.
3. FastAPI (Result):
    - On success:
        - Reads compiled PDF.
        - Returns as `application/pdf` with status `200`.
    - On failure:
        - Returns `400` with JSON:
            - `{ "detail": "Compilation failed", "logs": "<full logs>" }`.
    - Cleans up temp dir.
4. Frontend:
    - Shows loading state while compile is in progress.
    - On success:
        - Creates blob URL from PDF response.
        - Sets `activePreviewPdfBlobUrl`.
        - Renders PDF in preview pane.
    - On failure:
        - Shows a visual error view with log text.

#### 1.4.3. Flow C: RAG Synthesis Chat

1. Frontend (Right Pane – Synthesis tab):
    - User types a query and hits send.
    - Sends `POST /api/agents/synthesis` with JSON:
        - `{ "project_id": "<uuid>", "query": "<text>", "target_pdf_id": "<uuid|null>" }`.
2. FastAPI:
    - Embeds query using local embedding model.
    - Queries ChromaDB filtered by `project_id` and `target_pdf_id` if provided.
    - Selects top K chunks.
    - Constructs Gemini prompt with:
        - System instructions.
        - Context chunks.
        - User query.
    - Streams Gemini response back to client.
3. Frontend:
    - Consumes streaming response and appends tokens / lines to chat view in real time.

#### 1.4.4. Flow D: Manuscript Review

1. Frontend (Right Pane – Review tab):
    - User triggers review on current LaTeX file or entire manuscript.
    - Frontend fetches or already holds LaTeX content.
    - Sends `POST /api/agents/review` with:
        - `{ "latex_content": "<full tex string>" }`.
2. FastAPI:
    - Builds review prompt.
    - Calls Gemini with streaming.
    - Returns streaming Markdown response.
3. Frontend:
    - Streams into a review panel rendered as Markdown.

---

## 2. Frontend Specifications (React + Vite)

### 2.1. Folder and Module Organization

```text
frontend/
    src/
        app/
            main.tsx
            router.tsx           # Optional, simple routing if needed
        shared/
            components/
                Layout/
                    TriptychLayout.tsx
                UI/
                    Button.tsx
                    Spinner.tsx
                indicators/
                    SaveStatus.tsx
            hooks/
                useDebounce.ts
            api/
                client.ts         # Axios/fetch base, interceptors
                projects.ts
                files.ts
                compilation.ts
                agents.ts
            store/
                appStore.ts       # Zustand store
                selectors.ts
            types/
                domain.ts         # Shared DTO-like types
        features/
            projects/
                ProjectSelector.tsx
                useProjects.ts
            fileTree/
                FileTreePane.tsx
                contextMenu.tsx
                useFileTree.ts
            editor/
                EditorPane.tsx
                useEditorAutosave.ts
            reader/
                PdfReaderPane.tsx
                usePdfReader.ts
            compilePreview/
                CompileControls.tsx
                PreviewPane.tsx
                useCompile.ts
            agents/
                SynthesisPanel.tsx
                ReviewPanel.tsx
                useSynthesisChat.ts
                useReview.ts
````

---

### 2.2. Global State Management (Zustand)

#### 2.2.1. Store Shape

```typescript
// frontend/src/store/appStore.ts

export type LeftPaneMode = "files" | "library";
export type RightPaneMode = "search" | "synthesis" | "writing" | "review";
export type CenterMode = "idle" | "reading" | "writing";

export interface FileNode {
    id: string;
    name: string;
    fileType: "folder" | "latex" | "pdf_source" | "asset";
    children?: FileNode[];
    parentId: string | null;
}

interface AppState {
    // Project Context
    currentProjectId: string | null;
    projectFileTree: FileNode[];

    // Layout
    leftPaneMode: LeftPaneMode;
    rightPaneMode: RightPaneMode;
    centerMode: CenterMode;

    // Active content per project
    activeReadingPdfId: string | null;
    activeWritingTexId: string | null;
    activePreviewPdfBlobUrl: string | null;
    entryFileId: string | null;  // used for compilation

    // UI status
    isCompiling: boolean;
    compilationErrorLogs: string | null;

    // Autosave indicators
    isSaving: boolean;
    lastSavedAt: string | null;
    saveError: string | null;

    // Actions
    setCurrentProject: (projectId: string | null) => void;
    setProjectFileTree: (tree: FileNode[]) => void;

    setLeftPaneMode: (mode: LeftPaneMode) => void;
    setRightPaneMode: (mode: RightPaneMode) => void;
    setCenterMode: (mode: CenterMode) => void;

    openFileForWriting: (fileId: string) => void;
    openPdfForReading: (fileId: string) => void;

    setPreviewPdfBlobUrl: (url: string | null) => void;
    setEntryFileId: (fileId: string | null) => void;

    setCompilationStatus: (isCompiling: boolean, logs: string | null) => void;

    setSavingState: (args: { isSaving: boolean; error?: string | null; timestamp?: string | null }) => void;
}
```

#### 2.2.2. Behavior Requirements

* Switching `centerMode`:

  * When switching to `"writing"`, restore last `activeWritingTexId` for that project if possible.
  * When switching to `"reading"`, restore last `activeReadingPdfId`.
* Project switching:

  * Before switching, flush any pending autosaves for current project.
* Autosave:

  * Use a global debounce per file (approximately 1000 ms).
  * Display “Saving…” and “Saved at HH:MM:ss” in `SaveStatus`.
  * On save failure, set `saveError` and schedule retry with backoff.

---

### 2.3. Left Pane: File Tree (react-arborist)

#### 2.3.1. Requirements

* Displays hierarchical `FileNode[]` from backend `/api/projects/{id}/file-tree`.
* Max depth 4 enforced:

  * UI should prevent moves or creations that would exceed depth 4.
* Supports:

  * Create file (LaTeX, asset, PDF upload).
  * Create folder.
  * Rename.
  * Delete.
  * Drag and drop move within same project.

#### 2.3.2. Context Menu

Right-click context menu for a node:

* For Folders:

  * New File (LaTeX).
  * New Folder.
  * Upload PDF to this folder.
  * Delete Folder.
  * Rename Folder.
* For Files:

  * Rename.
  * Delete.
  * Open in editor (for LaTeX).
  * Open in reader (for PDF).

Each action triggers a corresponding backend API call, and on success the file tree is refreshed from the backend to avoid drift.

---

### 2.4. Center Pane: Editor (Monaco)

#### 2.4.1. Requirements

* Uses `@monaco-editor/react`.
* Configured for LaTeX syntax highlighting.
* Bound to a single `activeWritingTexId`.

#### 2.4.2. Autosave

* On every content change:

  * Local state updated immediately.
  * A debounced function triggers `PUT /api/files/{id}/content`.
* Autosave logic:

  * Debounce delay: ~1000 ms after last keystroke.
  * While saving:

    * `isSaving = true`.
    * Footer shows “Saving…”.
  * On success:

    * `isSaving = false`.
    * `lastSavedAt` updated.
  * On failure:

    * `isSaving = false`.
    * `saveError` set.
    * Automatic retries with increasing delay, but user can continue editing without blocking.

#### 2.4.3. Unsaved Changes Handling

* When user attempts to:

  * Switch files.
  * Switch projects.
  * Close browser tab.
* Behavior:

  * Best effort flush of current buffer via immediate save call.
  * No hard blocking dialogs are required in MVP, but may be added later.

---

### 2.5. Center Pane: PDF Reader and Preview (react-pdf)

#### 2.5.1. Full Reader Mode

* Active when `centerMode = "reading"`.
* Features:

  * Page navigation (prev, next, jump to page).
  * Zoom controls (fit width, zoom in, zoom out).
* No annotations or highlights in MVP.

#### 2.5.2. Split Preview Mode

* Active when `centerMode = "writing"` and `activePreviewPdfBlobUrl` is set.
* Shows compiled PDF for current project.
* Behavior:

  * Defaults to “fit to width”.
  * Does not require page thumbnails in MVP.

---

### 2.6. Compile Controls UX

* Compile button:

  * Calls `POST /api/projects/{id}/compile`.
  * Disabled while `isCompiling = true`.
* Visual feedback:

  * Status text: “Compiling…” in preview area.
  * Spinner or progress bar optional.
* On error:

  * Preview pane shows:

    * Short error summary.
    * Scrollable text view of compilation logs in monospaced font.

---

### 2.7. Right Pane: Agents

#### 2.7.1. Synthesis Panel (RAG Chat)

* UI:

  * Simple chat-style interface.
  * Shows past queries and responses for current session.
* Behavior:

  * Query is always scoped to current `project_id`.
  * Optional dropdown to constrain to a specific library PDF.
  * Results are streamed:

    * Tokens appended as they arrive.

#### 2.7.2. Review Panel

* UI:

  * Button to “Review Current File” or “Review Manuscript”.
  * Displays streamed Markdown response, rendered with a Markdown component.
* Behavior:

  * Frontend sends the full LaTeX content in the request body.
  * No need for backend to fetch LaTeX itself in Phase 1.

---

## 3. Backend Specifications (FastAPI)

### 3.1. Code Organization (DDD Layers)

```text
backend/
    app/
        domain/
            projects/
                entities.py
                repositories.py
                services.py
            files/
                entities.py
                value_objects.py
                repositories.py
                services.py
            compilation/
                entities.py
                services.py
            library_indexing/
                entities.py
                services.py
            agents/
                entities.py
                services.py
        application/
            dto/
                projects.py
                files.py
                compilation.py
                agents.py
            services/
                project_usecases.py
                file_usecases.py
                compile_usecases.py
                agent_usecases.py
        infrastructure/
            db/
                models.py
                session.py
                repositories/
                    project_repo.py
                    file_repo.py
            storage/
                filesystem.py
            rag/
                chroma_client.py
                embeddings.py
            latex/
                tectonic_runner.py
            llm/
                gemini_client.py
        presentation/
            api/
                routers/
                    projects.py
                    files.py
                    compilation.py
                    agents.py
                    health.py
            main.py
        seed/
            seed_data.py
        config.py
        logging_config.py
```

* `domain/*`: pure business logic, no FastAPI, SQLModel, or HTTP concerns.
* `application/*`: orchestration of domain services and mapping to DTOs.
* `infrastructure/*`: concrete adapters (DB, Chroma, Tectonic, Gemini).
* `presentation/*`: FastAPI routes and request/response handling.

---

### 3.2. Database Schema (SQLModel)

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class User(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
    username: str
    projects: List["Project"] = Relationship(back_populates="user")


class Project(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    entry_file_id: Optional[uuid.UUID] = Field(default=None, foreign_key="file.id")

    user: User = Relationship(back_populates="projects")
    files: List["File"] = Relationship(back_populates="project")


class FileType(str, Enum):
    FOLDER = "folder"
    LATEX = "latex"
    PDF_SOURCE = "pdf_source"
    ASSET = "asset"


class File(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id")
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="file.id")
    name: str
    file_type: FileType
    relative_path: Optional[str] = None
    is_indexed: bool = Field(default=False)
    indexing_failed: bool = Field(default=False)

    project: Project = Relationship(back_populates="files")
```

* Single user in MVP, but schema ready for multiple users.
* `entry_file_id` on `Project` indicates which LaTeX file to compile.

---

### 3.3. Local Storage Structure

```text
/local_storage_root/
    projects/
        {project_uuid_A}/
            main.tex
            other.tex
            figures/
                chart.png
            library_pdfs/
                smith_2023.pdf
                jones_2020.pdf
        {project_uuid_B}/
            ...
```

* Domain does not enforce folder names, but implementation standardizes `library_pdfs` as default location for uploaded PDFs.

---

### 3.4. API Conventions

* Errors:

  * `4xx` and `5xx` in JSON:

    * `{ "detail": "Human readable error", "code": "ERROR_CODE" }`.
* All endpoints scoped under `/api`.

---

### 3.5. Projects Endpoints

* `GET /api/projects`

  * Returns list of projects for the single local user.
* `POST /api/projects`

  * Body: `{ "name": "My Project" }`.
  * Creates project directory on disk and DB record.
* `GET /api/projects/{project_id}`

  * Returns project metadata.
* `DELETE /api/projects/{project_id}`

  * Deletes DB records and project directory from disk (MVP may allow hard delete).

---

### 3.6. File Tree and Content Endpoints

* `GET /api/projects/{project_id}/file-tree`

  * Returns hierarchical JSON suitable for `react-arborist`:

    * Array of root nodes, each with children.
* `POST /api/projects/{project_id}/files`

  * Body:

    * `{ "parent_id": "uuid|null", "name": "foo.tex", "file_type": "latex" }`.
  * Creates DB record and file on disk (empty file for LaTeX).
* `PATCH /api/files/{file_id}/move`

  * Body:

    * `{ "new_parent_id": "uuid|null" }`.
  * Validates depth constraint and updates parent.
* `PATCH /api/files/{file_id}/rename`

  * Body:

    * `{ "new_name": "bar.tex" }`.
* `DELETE /api/files/{file_id}`

  * Deletes DB record and file/directory from disk.
* `GET /api/files/{file_id}/content`

  * For LaTeX/bib: returns plain text.
  * For images/PDFs: returns binary with correct MIME type.
* `PUT /api/files/{file_id}/content`

  * Body:

    * `{ "content": "raw latex string" }`.
  * Overwrites file on disk.

---

### 3.7. PDF Upload and Indexing Endpoints

* `POST /api/projects/{project_id}/upload-pdf`

  * `multipart/form-data` with a single PDF file.
  * Saves file to `library_pdfs`.
  * Creates `File` record.
  * Triggers background indexing task.

* `POST /api/files/{file_id}/reindex`

  * Re-runs indexing for the given library PDF.
  * Used when indexing failed previously.

---

### 3.8. Compilation Endpoint

* `POST /api/projects/{project_id}/compile`

  * Body:

    * `{ "entry_file_id": "uuid" }`.
  * Uses the Compilation domain service.
* Responses:

  * `200 application/pdf`:

    * Compiled PDF.
  * `400 application/json`:

    * `{ "detail": "Compilation failed", "logs": "..." }`.

---

### 3.9. Agents Endpoints

* `POST /api/agents/search` (Mock, optional)

  * Body:

    * `{ "query": "string" }`.
  * Returns hardcoded list of fake papers for early UI development.

* `POST /api/agents/review`

  * Body:

    * `{ "latex_content": "full tex string" }`.
  * Behavior:

    * Constructs reviewer prompt.
    * Calls Gemini in streaming mode.
    * Streams Markdown response.

* `POST /api/agents/synthesis`

  * Body:

    * `{ "project_id": "uuid", "query": "What does X say?", "target_pdf_id": "uuid|null" }`.
  * Behavior:

    * Embeds query locally.
    * Queries ChromaDB for that `project_id` and optionally `file_id`.
    * Builds prompt with retrieved chunks.
    * Calls Gemini streaming.
    * Streams response back.

---

### 3.10. Health and Readiness

* `GET /health`

  * Returns:

    * `{ "status": "ok" }` if FastAPI is running.
* `GET /ready`

  * Checks:

    * DB connectivity.
    * ChromaDB availability.
    * Local storage root writeability.
  * Returns:

    * `{ "status": "ready" }` or `{ "status": "degraded", "issues": ["db", "chroma"] }`.

---

### 3.11. Seed Data

* `backend/app/seed/seed_data.py`:

  * Creates one default user:

    * `email = "local@sevenfold.dev"`, `username = "local"`.
  * Creates sample project:

    * Name: `"Sample Project"`.
    * Directory with:

      * `main.tex` containing minimal compilable LaTeX.
      * Optional `figures/` with a placeholder image.
  * Can be invoked via CLI or simple script call.

---

### 3.12. Logging

* Use structured logging.
* Log categories:

  * HTTP requests (path, status, latency).
  * Compile jobs: start, success, failure with error summary.
  * Indexing jobs: start, success, failure with reason.
  * Errors: stack traces and correlation IDs.

No analytics or telemetry in MVP.

---

## 4. Non-Functional Requirements

### 4.1. Performance and Scale Targets

* Each project:

  * Up to ~200 files.
  * Up to ~50 PDFs.
  * Individual PDF up to ~25 MB.
* System should remain responsive on a typical dev laptop.

### 4.2. Reliability and Error Handling

* All error responses use standard JSON format with `detail` and `code`.
* Frontend should:

  * Display user-friendly error messages.
  * Allow retry where reasonable (save, index, compile, RAG query).
* Backend should:

  * Fail fast on misconfigurations (missing storage root, missing Tectonic).

### 4.3. Local Development Experience

* Mixed setup allowed:

  * Postgres via Docker or native.
  * Chroma either in-process or separate.
* Simple `make` or script-driven commands recommended:

  * `make dev-backend`.
  * `make dev-frontend`.
  * `make seed`.

---

## 5. Implementation Priorities and Risks

### 5.1. Priorities

1. **Priority 1: File Tree → Editor → Compile → Preview Loop**

   * Core LaTeX workflow:

     * Projects.
     * File tree.
     * Editor with autosave.
     * Compile.
     * PDF preview.

2. **Priority 2: PDF Upload and Reading**

   * Upload per-project PDFs.
   * Basic PDF reader with navigation and zoom.
   * Indexing pipeline (without complex UX).

3. **Priority 3: AI Agents**

   * Review agent (LaTeX in, Markdown out).
   * RAG synthesis with project-scoped context.
   * Streaming end-to-end.

---

### 5.2. Risks and Mitigations

1. **Tectonic Environment Issues**

   * Risk:

     * Tectonic not installed or not on PATH.
   * Mitigation:

     * Early setup and verification script.
     * Clear error message in readiness probe if missing.

2. **Embedding and Chroma Setup**

   * Risk:

     * Large PDFs, slow indexing.
   * Mitigation:

     * Use CPU-friendly model.
     * Keep chunk size and count manageable.
     * Allow indexing to be eventually consistent.

3. **Streaming Integration**

   * Risk:

     * Complexity in streaming Gemini responses through FastAPI to frontend.
   * Mitigation:

     * Implement simple streaming API first.
     * Build minimal chat UI that consumes streaming without extra features like multi-turn history persistence.