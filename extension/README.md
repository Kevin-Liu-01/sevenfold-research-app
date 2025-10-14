# Sevenfold Chrome Extension

Chrome extension (Manifest V3) that enables researchers to collect and upload research PDFs directly to their Sevenfold library from anywhere on the web.

Integrates with academic repositories (arXiv, ACM, IEEE) to extract metadata and seamlessly add papers to projects. Built with Vite.

## Architecture

The extension follows Chrome Manifest V3 architecture with three main components:

### Background Service Worker (`src/background/`)

The service worker handles:
- **Authentication**: PKCE OAuth flow with Supabase (`pkce.js`)
- **Session Management**: Persistent session storage across browser restarts (`sessionStore.js`)
- **Message Routing**: Communication hub between content scripts, popup, and Supabase

Since service workers can be terminated at any time by Chrome, all state is persisted to `chrome.storage.local` and restored on wake.

### Content Scripts (`src/content/`)

Injected into web pages to detect PDFs and provide capture UI:

- **Shadow DOM**: Uses a shadow root to inject UI elements without CSS conflicts from the host page
- **PDF Detection**: Scans page for arXiv IDs, DOIs, and PDF links
- **Metadata Extraction**: Site-specific scrapers for arXiv, ACM, IEEE to extract title, authors, abstract, etc.
- **In-Page Overlay**: Non-intrusive floating UI for quick paper capture

The shadow DOM approach (`shadow-root.html`, `shadow-root.css`) ensures complete style isolation from the host page, preventing conflicts.

### Popup UI (`src/popup/`)

Browser action popup for the main extension interface:

- **Feature Modules** (`features/`): Organized by domain (auth, projects, PDF metadata)
- **State Management** (`state/store.js`): Centralized state for the popup
- **Runtime Messaging** (`services/`): Communication with background worker

The popup uses a modular architecture where each feature (auth, projects, etc.) is self-contained with its own logic and DOM manipulation.
