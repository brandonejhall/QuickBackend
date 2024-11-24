from fastapi import APIRouter
from . import auth,docuement_managment

api_router = APIRouter()

# Include routers from endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    docuement_managment.router,
    prefix="/documents",
    tags=["documents"]
)