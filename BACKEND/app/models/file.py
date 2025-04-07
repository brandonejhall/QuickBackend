from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class Files(SQLModel, table=True):
    __tablename__ = "files"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field()
    document_type: str = Field()
    user_id: int = Field(foreign_key="users.id")
    uploaded_by: Optional[str] = Field(default=None)  # Make it optional with a default value
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship with Users
    user: "Users" = Relationship(back_populates="files") 