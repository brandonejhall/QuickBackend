from fastapi import APIRouter
from app.schemas import UserBase, UserLogin

router = APIRouter()


@router.post("/register")
async def register(user: UserBase):
    return user


@router.post("/login")
async def login(user_login: UserLogin):
    return user_login