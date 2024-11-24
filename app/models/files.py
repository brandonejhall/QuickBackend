from .user import *
from sqlmodel import Field,Relationship,SQLModel


class Files(SQLModel,table =True):
    id : int | None = Field(default = None, primary_key=True)
    file_name : str = Field(index=True)
    file_type : str = Field()
    user_id: int | None = Field(default=None, foreign_key="users.id")
    user: Users | None = Relationship(back_populates="files")