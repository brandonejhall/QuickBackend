from fastapi import APIRouter
from app.api import auth
from app.api import document_management
from app.api.endpoints import project_notes

api_router = APIRouter()

# Include routers from endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

api_router.include_router(
    document_management.router,
    prefix="/documents",
    tags=["documents"]
)

api_router.include_router(
    project_notes.router,
    prefix="/project-notes",
    tags=["project-notes"]
)


