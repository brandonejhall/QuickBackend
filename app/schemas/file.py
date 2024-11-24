from pydantic import BaseModel
from typing import Optional


class FileBase(BaseModel):
    filename: str
    content_type: str
    document_type: str

    class Config:
        from_attributes = True


class FileCreate(FileBase):
    user_id: int


class FileUpdate(BaseModel):
    filename: Optional[str] = None
    content_type: Optional[str] = None
    document_type: Optional[str] = None


class FileResponse(FileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True