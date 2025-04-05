from sqlalchemy import String, Integer, Column, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class UserRole(enum.Enum):
    ADMIN = "admin"
    USER = "user"

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, nullable=False, index=True)
    password = Column(String, nullable=False, index=True)
    fullname = Column(String, nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    files = relationship("Files", back_populates="users")

__all__ = ['Users', 'UserRole']



