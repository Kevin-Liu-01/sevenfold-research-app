# Ketspen: Full Stack Architecture

Ketspen is an academic research workspace that lets users **find, store, annotate, digest, and write** academic manuscripts and papers. Below is the proposed architecture, **split into frontend and backend**, using:

- **Frontend:** React + Vite  
- **Backend:** FastAPI  
- **Authentication/DB:** Supabase (Auth + quick relational DB) + MongoDB (core data)  

---

## 1. Folder & File Structure

```
ketspen/
│
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ │ ├── auth/
│ │ │ │ ├── LoginPage.tsx
│ │ │ │ └── SignupPage.tsx
│ │ │ ├── sidebar/
│ │ │ │ └── Sidebar.tsx
│ │ │ ├── pdfviewer/
│ │ │ │ └── PDFViewer.tsx
│ │ │ ├── chatbot/
│ │ │ │ └── Chatbot.tsx
│ │ │ └── common/
│ │ ├── pages/
│ │ │ ├── Home.tsx
│ │ │ ├── ProjectPage.tsx
│ │ │ └── SearchPage.tsx
│ │ ├── hooks/
│ │ ├── context/
│ │ │ ├── AuthContext.tsx
│ │ │ ├── ProjectContext.tsx
│ │ │ └── UIContext.tsx
│ │ ├── services/
│ │ │ ├── supabaseClient.ts
│ │ │ ├── api.ts
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── index.css
│ ├── package.json
│ └── vite.config.ts
│
└── backend/
├── app/
│ ├── main.py
│ ├── api/
│ │ ├── auth.py
│ │ ├── projects.py
│ │ ├── papers.py
│ │ └── manuscript.py
│ ├── db/
│ │ ├── mongo.py
│ │ ├── supabase.py
│ ├── models/
│ │ ├── user.py
│ │ ├── project.py
│ │ ├── paper.py
│ │ └── manuscript.py
│ ├── services/
│ │ ├── pdf_processing.py
│ │ ├── search.py
│ │ ├── ai_chatbot.py
│ └── utils/
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 2. What Each Part Does

### **Frontend**

#### `/public`
- Static files, favicon, etc.

#### `/src/components/auth`
- **LoginPage.tsx, SignupPage.tsx:** UI for authentication, talking to Supabase for sign in/up.

#### `/src/components/sidebar`
- **Sidebar.tsx:** Displays navigation tabs: Home, Search, Settings, Active Papers, Semi-Useful Papers, Manuscript.

#### `/src/components/pdfviewer`
- **PDFViewer.tsx:** Embedded PDF reader. Can load PDFs stored by the user.

#### `/src/components/chatbot`
- **Chatbot.tsx:** AI chatbot for PDF Q&A (calls backend).

#### `/src/pages`
- **Home.tsx:** Lists all projects a user is a part of.
- **ProjectPage.tsx:** Shows the main project workspace with sidebar, viewer, and logic to switch between Search, Papers, Manuscript, etc.
- **SearchPage.tsx:** For searching and adding new papers to project.

#### `/src/context`
- **AuthContext.tsx:** User auth state (using Supabase).
- **ProjectContext.tsx:** State for selected project, current papers, manuscript, etc.
- **UIContext.tsx:** Tracks UI state: which viewer tab is active, etc.

#### `/src/services`
- **supabaseClient.ts:** Connects frontend to Supabase (auth, relational queries).
- **api.ts:** Handles requests to FastAPI backend for PDF upload, search, AI, etc.

---

### **Backend**

#### `/app/main.py`
- Entry point, sets up FastAPI app, routers, middleware.

#### `/app/api`
- **auth.py:** Handles authentication logic if needed server-side (token verification, role checks).
- **projects.py:** CRUD for projects.
- **papers.py:** CRUD for papers, PDF file management.
- **manuscript.py:** Manuscript storage, update, versioning.

#### `/app/db`
- **mongo.py:** MongoDB connection logic and models (for paper data, annotations, manuscript drafts, etc).
- **supabase.py:** Utility functions to verify Supabase JWTs, look up users, sync users between Supabase and Mongo.

#### `/app/models`
- Pydantic models for API schema (User, Project, Paper, Manuscript).

#### `/app/services`
- **pdf_processing.py:** PDF parsing, annotation extraction, upload logic.
- **search.py:** Handles paper search (e.g., Crossref, Semantic Scholar API).
- **ai_chatbot.py:** AI-powered chatbot endpoints, leverages LLM API or local model.

#### `/app/utils`
- Helper utilities (file management, error handling).

---

## 3. Where State Lives & How Services Connect

### **Frontend State Management**

- **Auth State:**  
  - Lives in `AuthContext` (React Context).
  - Source: Supabase session/token (localStorage/cookies).

- **Project State:**  
  - `ProjectContext` manages current project, list of papers (active/semi-useful), manuscript draft.
  - Updated via API calls to backend.

- **UI State:**  
  - `UIContext` for viewer tab state, e.g. which tab is active (PDF, Manuscript, Search, etc).

---

### **Backend State & Data Flow**

- **Supabase:**  
  - Used for Authentication (JWT) and simple user/project membership (relational lookups).
  - Used for inviting users to projects.

- **MongoDB:**  
  - Stores core research data:
    - Projects (ID, members, settings)
    - Papers (metadata, status, annotations)
    - Manuscript drafts, comments, versioning
    - User annotation history

- **API Auth:**  
  - Backend receives Supabase JWT from frontend (as Authorization header), verifies using Supabase public key.

---

### **Frontend↔Backend Communication**

- **API Requests:**  
  - `api.ts` makes requests to `/api` endpoints on FastAPI backend (e.g., `/api/projects/:id/papers`, `/api/manuscript`).
  - JWT sent with every request for backend to verify.

- **Supabase Client:**  
  - Used in frontend for direct auth/login, lightweight queries, and real-time updates if needed.

---

### **Sample Page/Interaction Flows**

#### **1. Login**
- `LoginPage.tsx` uses Supabase Client to authenticate.
- On login success, JWT is stored and all subsequent frontend API calls include JWT in Authorization header.

#### **2. Home (Project List)**
- `Home.tsx` queries backend for list of projects for this user (using JWT for auth).

#### **3. Project Workspace**
- `ProjectPage.tsx` renders:
  - **Sidebar** (`Sidebar.tsx`):  
    - Home: redirects to `Home.tsx`
    - Search: switches viewer to `SearchPage.tsx`
    - Active Papers / Semi-Useful Papers: fetched from backend, rendered as clickable items.
    - Manuscript: tab shows manuscript editor.
  - **Viewer:** Controlled by UIContext.  
    - PDF: loads `PDFViewer.tsx` and `Chatbot.tsx`  
    - Manuscript: loads markdown editor  
    - Search: shows search results

#### **4. PDF Viewing + Chatbot**
- On PDF tab, `PDFViewer.tsx` loads PDF (via backend API/maybe presigned URL from storage).
- `Chatbot.tsx` opens chat interface, which sends user questions (and PDF context) to FastAPI endpoint for AI response.

---

## 4. Diagram (Textual)

[Frontend: React + Vite] <--JWT--> [FastAPI Backend] <---> [MongoDB]
| |
+--(Supabase Client)---[Supabase Auth/DB]


- **Supabase:** Handles authentication for frontend, basic relational data for users/projects.
- **FastAPI:** Main app logic, talks to both Supabase (to verify users) and MongoDB (to store core data).
- **MongoDB:** Stores everything project/paper/manuscript-related.
- **Frontend:** Purely React/Vite, calls backend for all data, uses Supabase for login/session.

---

## 5. Key Notes

- **Supabase handles login/session directly from frontend, minimizing backend overhead.**
- **All state (project/paper data, manuscript, etc) is fetched from backend, but cached and managed in React context for UX.**
- **Backend is responsible for permissions, heavy logic, and integration (PDF parsing, AI chatbot, annotation storage).**
- **Frontend focuses only on UI, state management, and talking to backend.**

---

*This architecture offers scalability, security, and a clear separation between frontend and backend, making it easy to grow features and maintain data integrity.*
