from sqlalchemy import ForeignKey, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class Files(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, nullable=False)
    filename = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key to Users table
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("Users", back_populates="files")
