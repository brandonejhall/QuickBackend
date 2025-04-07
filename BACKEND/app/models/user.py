from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class Users(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    password: str = Field(index=True)
    fullname: str = Field(index=True)
    role: UserRole = Field(default=UserRole.USER)
    files: List["Files"] = Relationship(back_populates="users")

__all__ = ['Users', 'UserRole']



