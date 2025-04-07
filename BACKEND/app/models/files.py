from sqlmodel import SQLModel, Field, Relationship, ForeignKey
from typing import Optional
from datetime import datetime

class Files(SQLModel, table=True):
    __tablename__ = "files"

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    document_type: str
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    users: Optional["Users"] = Relationship(back_populates="files")
