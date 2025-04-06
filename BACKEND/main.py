import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
import uvicorn

app = FastAPI(
    title="Document Management System API",
    description="API for managing documents with Google Drive integration",
    version="1.0.0"
)

# Configure CORS - make it more flexible for different environments
origins = os.getenv("ALLOWED_ORIGINS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # This will now accept multiple origins from environment variable
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Get port from environment variable
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Disable reload in production
    ) 