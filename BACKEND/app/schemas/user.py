from pydantic import BaseModel, EmailStr
from typing import Optional, List

from .file import *



class UserBase(BaseModel):
    email: str
    fullname: str


class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    fullname: Optional[str] = None



class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    hashed_password: str


class UserWithFiles(UserResponse):
    files: List['FileResponse'] ='default factory'

    class Config:
        from_attributes = True
