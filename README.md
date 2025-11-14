# Harbor

The monorepo for all client-facing applications of [Sevenfold](https://sevenfold.ai).

## About Sevenfold

Sevenfold is building an all-in-one agentic research environment for academics to find, read, digest, annotate, and produce papers. Our software serves as a self-improving environment that understands the context of your research project.

## Monorepo Structure

- **www/** - Next.js application serving as the landing and marketing page. Hosted on the `www` subdomain with SEO optimization.

- **webapp/** - React + Vite application containing the core Sevenfold product. Hosted on the `app` subdomain and optimized for performance and user experience.

- **api/** - FastAPI-based Python backend powering the Sevenfold platform.

- **latex-service/** - Standalone FastAPI microservice that shells out to the Tectonic engine to compile LaTeX into PDFs for the compose flow.

- **schema/** - Database schema definitions and type declarations for Supabase.

- **extension/** - Google Chrome extension enabling research workflows directly in the browser.

## Getting Started

Each subdirectory contains its own README with specific setup instructions and development guidelines.

### Running the backend stack with Docker Compose

1. Copy `api/env.template` to `api/.env` and populate your Supabase and Anthropic secrets.
2. From the repo root, run `docker compose up --build` to launch just the backend containers, or `./run.sh` to both start the containers (in detached mode) and bring up the `webapp` dev server.
3. The API will be available on `http://localhost:8080` and the LaTeX compiler on `http://localhost:8081`. The API automatically talks to the compiler through the internal Compose network via `LATEX_SERVICE_URL=http://latex-service:8081`.

Use `docker compose down` when you are finished.

### Local app development

- `./setup.sh` installs Node and Python dependencies for `www/`, `webapp/`, and `api/` if you plan to run them directly on your host.
- Copy `webapp/env.template` to `webapp/.env` so the frontend has its environment configured before starting.
- `./run.sh` spins up the backend Docker Compose stack (API + LaTeX compiler) in detached mode and then launches the `webapp` Vite dev server locally on `:5173`. Hitting Ctrl+C stops the webapp and brings the containers down.
- If you also need the marketing site (`www/`) or other tooling, start those apps manually with `pnpm dev` in their respective directories.
