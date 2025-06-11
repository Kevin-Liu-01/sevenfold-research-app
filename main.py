from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.papers import router as papers_router

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
