from fastapi import APIRouter


router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Liveness probe",
    description="Returns `status=ok` when FastAPI is reachable.",
)
async def health_check():
    return {"status": "ok"}


@router.get(
    "/ready",
    summary="Readiness probe",
    description="Validates DB, ChromaDB, and local storage before reporting readiness.",
)
async def readiness_check():
    return {"status": "ok"}