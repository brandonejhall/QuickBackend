from .files import Files
from sqlmodel import Field,Relationship,  SQLModel


class Users(SQLModel, table = True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    username: str = Field(index=True)
    fullname: str = Field(index=True)
    files: list["Files"] =  Relationship(back_populates="users")



