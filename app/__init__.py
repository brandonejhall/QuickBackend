from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .database.database import engine, SessionLocal, get_db
from .models.base import Base
from .api import router as api_router
app.include_router(api_router.api_router, prefix="/api")

Base.metadata.create_all(bind=engine)

__all__ = ["app"]
