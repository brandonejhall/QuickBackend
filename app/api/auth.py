from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import UserBase, UserLogin, UserCreate
from ..models import Users


router = APIRouter()


@router.post("/register")
async def register(user: UserCreate,db: Session = Depends(get_db)):
    existing = (db.query(Users).filter(
        (Users.email == user.email)  ).first())
    if existing:
        raise HTTPException(status_code=400, detail="email already registered")
    new_user = create_user(user,db)
    return new_user


@router.post("/login")
async def login(user_login: UserLogin):
    return user_login



def create_user(user: UserBase, db: Session):
    db_user = Users(
        email=user.email,
        fullname=user.fullname,
        password=user.password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user