import uvicorn
from app import app

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        port=8000,
        reload=True,  # Enable auto-reload during development
        workers=1,    # Number of worker processes
        log_level="info",
    )