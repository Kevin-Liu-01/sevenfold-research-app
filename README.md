# Harbor

The monorepo for all client-facing applications of [Sevenfold](https://sevenfold.ai).

## About Sevenfold

Sevenfold is building an all-in-one agentic research environment for academics to find, read, digest, annotate, and produce papers. Our software serves as a self-improving environment that understands the context of your research project.

## Monorepo Structure

- **www/** - Next.js application serving as the landing and marketing page. Hosted on the `www` subdomain with SEO optimization.

- **webapp/** - React + Vite application containing the core Sevenfold product. Hosted on the `app` subdomain and optimized for performance and user experience.

- **api/** - FastAPI-based Python backend powering the Sevenfold platform.

- **schema/** - Database schema definitions and type declarations for Supabase.

- **extension/** - Google Chrome extension enabling research workflows directly in the browser.

## Getting Started

Each subdirectory contains its own README with specific setup instructions and development guidelines.