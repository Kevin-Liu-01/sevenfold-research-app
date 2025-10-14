# Sevenfold API

FastAPI-based backend powering the Sevenfold platform. Built with Python and FastAPI.

This server handles paper management, search, AI features, and integrates with Supabase for data persistence.

## Architecture

The API is organized into domain-specific routers (`routes/`):

### Papers Router (`papers_router.py`)
Handles all paper-related operations:
- PDF upload and processing (extract metadata, generate embeddings)
- CRUD operations on paper metadata
- XML-based annotation storage and retrieval
- Linking papers to projects via `project_paper_links`

### Search Router (`search_router.py`)
Powers the public corpus discovery:
- **Full-text search**: PostgreSQL's `tsvector` and GIN indexes for keyword search
- **Semantic search**: pgvector with HNSW index for ANN queries using paper embeddings
- **Hybrid search**: Combines both approaches with configurable weights

Embeddings are generated using HuggingFace transformers (see `utils/`).

### Chatbot Router (`chatbot_router.py`)
Research assistant powered by Anthropic's Claude:
- Maintains conversation context
- Can reference papers in the user's project
- Uses prompt templates from `prompts/` directory

### Compose Router (`compose_router.py`)
Assists with academic writing:
- AI suggestions for Markdown and LaTeX compositions
- Context-aware improvements based on cited papers
- Grammar and style refinement

### Projects Router (`projects_router.py`)
Basic CRUD for research projects. Most project logic is handled client-side with direct Supabase calls.

## Authentication

Most endpoints require JWT authentication via Supabase. The API extracts and validates the JWT from the `Authorization: Bearer <token>` header using the `SUPABASE_JWT_SECRET`.

The user ID from the validated token is used to enforce row-level security when querying Supabase.
