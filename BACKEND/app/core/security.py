from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import bcrypt
from sqlalchemy.orm import Session
from ..models import Users
from ..database import get_db

load_dotenv()

# JWT configuration
SECRET_KEY = os.environ.get('SECRET_KEY')  # Use a strong, randomly generated key
ALGORITHM = os.environ.get('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES')

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its bcrypt hash
    """
    # Convert inputs to bytes
    plain_password_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    
    # Check password
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)

def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate a salt and hash
    salt = bcrypt.gensalt(rounds=12)  # 12 is a good default, higher = more secure but slower
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Convert to string for storage
    return hashed.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=float(ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    return email

def get_db_user(email: str, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == email).first()
    return user