from pydantic import BaseModel, EmailStr

class User(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Document(BaseModel):
    name: str
    content_type: str
    document_type: str