from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database and models
from .database.database import engine
from .models.base import Base
from .api.router import api_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Document Management System",
    description="API for managing documents with Google Drive integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

__all__ = ["app"]
