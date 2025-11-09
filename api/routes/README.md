# API Routes

This directory contains the modular API routes for the application, built using FastAPI's `APIRouter`. Each file corresponds to a distinct domain of functionality.

## General Structure

The API is designed around a set of resources (Projects, Papers, Compositions, etc.), with each router handling the CRUD (Create, Read, Update, Delete) operations for its respective resource.

### Authentication

Most endpoints require authentication via a JSON Web Token (JWT). The client must provide a valid token in the `Authorization` header with the `Bearer` scheme.

- **`_get_user_id(authorization: str)`**: A common utility function used in each router to decode the JWT and extract the user's unique ID.
- **`_verify_project_access(project_id: str, user_id: str)`**: A security function to ensure that the authenticated user has ownership of or access to the requested project, preventing unauthorized data access.

### Database

All routes interact with a Supabase backend for data persistence. The `db.supabase` client is used to perform database operations.

---

## Routers

### `chatbot_router.py`

Handles real-time chat and conversation management.

- **`POST /chat/new_message`**: The primary endpoint for sending a user's message. It can optionally handle PDF uploads for analysis. The backend uses the Anthropic API to generate an AI response. If it's the first message in a conversation, a title for the conversation is generated automatically.

### `compose_router.py`

Manages documents called "compositions," which can be either LaTeX or Markdown.

- **`POST /compose/new_composition`**: Creates a new composition (LaTeX or Markdown) within a project.
- **`GET /compose/project/{project_id}`**: Retrieves all compositions for a given project, with an option to filter by type (`latex` or `markdown`).
- **`GET /compose/{composition_id}`**: Fetches a single composition by its ID.
- **`PUT /compose/update/{composition_id}`**: Updates the title, content, or type of an existing composition.
- **`DELETE /compose/remove/{composition_id}`**: Deletes a composition.

### `papers_router.py`

Manages the complete lifecycle of research papers in user projects, from metadata extraction through storage and retrieval.

- **`POST /papers/extract-metadata`**: Analyzes a PDF using Claude AI to extract bibliographic metadata (title, authors, abstract, publication date, DOI, category). Accepts a `pages_spec` parameter (e.g., "1,2" or "1-3,5") to process specific pages. Returns the extracted metadata and automatically checks if a matching paper already exists in the public corpus using fuzzy title matching, helping avoid duplicates.

- **`POST /papers/upload-private`**: Creates a new paper entry in your private corpus. Uploads the PDF to secure storage, generates a paper record with the provided metadata, links it to the specified project, and returns a preview URL. This is for papers unique to your library.

- **`POST /papers/link-pdf-public`**: Attaches an existing paper from the public corpus to your project. Instead of creating a duplicate paper record, this reuses the existing metadata while uploading your copy of the PDF. Useful when the paper was discovered via metadata extraction and you want to add it to your project.

- **`GET /papers/{paper_id}/signed-url`**: Generates a temporary, secure URL (default 1 hour) to view or download a paper's PDF. Requires both `paper_id` and `project_id` to verify access permissions before creating the signed URL.

- **`PUT /papers/{paper_id}/annotations`**: Stores user annotations for a specific paper within a project context. Annotations are project-scoped, allowing different notes for the same paper across multiple projects.

### `projects_router.py`

This router is responsible for managing user projects. (Currently, it contains helper functions but no exposed endpoints in the provided snippet).

### `search_router.py`

Provides advanced search capabilities across the corpus of papers.

- **`POST /search/`**: Performs a hybrid search that combines traditional text-based (lexical) search with modern vector-based (semantic) search. It uses the `allenai/specter2_base` model to create embeddings for user queries. The search can be weighted and filtered by year.
- **`GET /search/project-context/{project_id}`**: Computes a "context vector" for a project by averaging the embeddings of all papers within that project. This vector can be used to tailor search results to the project's domain.
