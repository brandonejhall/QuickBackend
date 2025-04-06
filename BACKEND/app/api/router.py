from fastapi import APIRouter
from . import auth, document_management

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


