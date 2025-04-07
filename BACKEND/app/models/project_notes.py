from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class ProjectNote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    file_id: Optional[str] = None  # Google Drive file ID
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) 