from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.security import hash_password_bcrypt,get_db_user, verify_password_bcrypt,create_access_token
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

    create_user(user,db)

    return  {"message": "User created successfully"}


@router.post("/login")
async def login(user_login: UserLogin,db: Session = Depends(get_db)):
    user = (db.query(Users).filter(
        (Users.email == str(user_login.email))  ).first())
    print(user_login)
    print(user.password)
    if not user or verify_password_bcrypt(user_login.password,user.password,):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    print('access_token is the issue')
    access_token = create_access_token(
        data={"sub":user.email}
    )

    return{
            "access_token":access_token,
            "token_type": "bearer"
        }




def create_user(user: UserBase, db: Session):
   db_user = Users(
        email=user.email,
        fullname=user.fullname,
        password=hash_password_bcrypt(user.password)
    )

   db.add(db_user)
   db.commit()
   db.refresh(db_user)
   return db_user


