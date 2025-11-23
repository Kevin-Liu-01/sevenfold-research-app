from fastapi import FastAPI

from routes.agents_router import router as agents_router
from routes.files_router import router as files_router
from routes.health_router import router as health_router
from routes.projects_router import router as projects_router


app = FastAPI(
    title="Sevenfold API",
    version="0.1.0",
    contact={"name": "Sevenfold"},
)


for router in (
    health_router,
    projects_router,
    files_router,
    agents_router,
):
    app.include_router(router)
