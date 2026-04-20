from fastapi import APIRouter
from app.api import auth
from app.api import document_management
from app.api.endpoints import project_notes, assets, dashboard, cost_events, activity, users

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

api_router.include_router(
    assets.router,
    prefix="/assets",
    tags=["assets"]
)

api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["dashboard"]
)

api_router.include_router(
    cost_events.router,
    prefix="/cost-events",
    tags=["cost-events"]
)

api_router.include_router(
    activity.router,
    prefix="/activity-feed",
    tags=["activity-feed"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)


