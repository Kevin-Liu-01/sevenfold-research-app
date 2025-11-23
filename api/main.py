from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.agents_router import router as agents_router
from routes.files_router import router as files_router
from routes.health_router import router as health_router
from routes.projects_router import router as projects_router


app = FastAPI(
    title="Sevenfold API",
    version="0.1.0",
    contact={"name": "Sevenfold"},
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health_router,
    projects_router,
    files_router,
    agents_router,
):
    app.include_router(router)
