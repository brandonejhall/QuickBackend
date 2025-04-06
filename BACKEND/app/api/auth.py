from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from ..core.security import verify_password, get_password_hash, create_access_token
from ..database import get_db
from ..schemas import UserBase, UserLogin, UserCreate
from ..models import Users, UserRole

router = APIRouter()

@router.post("/register")
@router.post("/signup")
async def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Received signup request: {user.email}")
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {request.headers}")
    
    existing = db.query(Users).filter(Users.email == user.email).first()
    if existing:
        logger.warning(f"Email already registered: {user.email}")
        raise HTTPException(status_code=400, detail="email already registered")

    logger.info(f"Creating new user: {user.email}")
    create_user(user, db)
    logger.info(f"User created successfully: {user.email}")
    return {"message": "User created successfully"}

@router.post("/login")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == str(user_login.email)).first()
    
    if not user or not verify_password(user_login.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value  # Include role in response
    }

def create_user(user: UserBase, db: Session):
    db_user = Users(
        email=user.email,
        fullname=user.fullname,
        password=get_password_hash(user.password),
        role=UserRole.USER  # Default role is USER
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


