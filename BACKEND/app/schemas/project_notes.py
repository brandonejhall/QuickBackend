from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectNoteBase(BaseModel):
    title: str
    description: str

class ProjectNoteCreate(ProjectNoteBase):
    pass

class ProjectNoteUpdate(ProjectNoteBase):
    title: Optional[str] = None
    description: Optional[str] = None

class ProjectNote(ProjectNoteBase):
    id: int
    file_id: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 