from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.papers_router import router as papers_router
from routes.projects_router import router as projects_router
from routes.search_router import router as search_router
from routes.chatbot_router import router as chatbot_router
from routes.compose_router import router as compose_router

app = FastAPI()

# CORS config (adjust for production)
origins = [
    "http://localhost:3000",  # React/Vite dev server
    "http://localhost:5173",  # Vite default
    "https://www.sevenfold.so"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(papers_router)
app.include_router(projects_router)
app.include_router(search_router)
app.include_router(chatbot_router)
app.include_router(compose_router)