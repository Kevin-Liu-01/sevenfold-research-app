from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.papers import router as papers_router
from routes.projects import router as projects_router
from routes.search import router as search_router
from routes.chatbot import router as chatbot_router
from routes.compositions import router as compositions_router

app = FastAPI()

# CORS config (adjust for production)
origins = [
    "http://localhost:3000",  # React/Vite dev server
    "http://localhost:5173",  # Vite default
    "https://www.ketspen.com"
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
app.include_router(compositions_router)