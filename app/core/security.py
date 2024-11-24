from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv
from models import *



load_dotenv()

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')


fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "full_name": "John Doe",
        "email": "johndoe@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        "disabled": False,
    }
}





pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    """
    Verify if the provided plain text password matches the stored hashed password
    
    Security: Prevents storing or comparing passwords in plain text
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Convert a plain text password to a secure hash
    
    Security: Ensures passwords are never stored in their original form
    """
    return pwd_context.hash(password)

def get_user(db, username: str):
    """
    Retrieve user information from the database
    
    Provides a layer of abstraction between the authentication system and data storage
    """
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    """
    Comprehensive user authentication process
    
    Checks:
    1. User exists in the database
    2. Provided password is correct
    
    Returns user object if authentication successful, otherwise False
    """
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Generate a JSON Web Token (JWT)
    
    Steps:
    1. Copy input data
    2. Set expiration time
    3. Add expiration to token payload
    4. Encode and sign the token
    
    Security: 
    - Time-limited tokens
    - Signed with a secret key
    - Prevents token reuse
    """
    to_encode = data.copy()
    if expires_delta:
        # Calculate exact expiration time in UTC
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default expiration if not specified
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Add expiration timestamp to the token
    to_encode.update({"exp": expire})
    
    # Encode the token with a secret key and algorithm
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Validate the current user's token
    
    Comprehensive token validation:
    1. Decode the token
    2. Extract username
    3. Retrieve user from database
    4. Handle various potential errors
    
    Raises authentication exception if any validation fails
    """
    # Predefined exception for unauthorized access
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Attempt to decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract username from token
        username: str = payload.get("sub")
        if username is None:
            # No username in token = invalid token
            raise credentials_exception
        
        # Create token data object
        token_data = TokenData(username=username)
    except InvalidTokenError:
        # Token is invalid or has been tampered with
        raise credentials_exception
    
    # Retrieve user from database
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        # User no longer exists
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Additional user status check
    
    Ensures the authenticated user:
    1. Exists
    2. Is not disabled/inactive
    
    Prevents access for suspended or inactive accounts
    """
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    Primary login endpoint
    
    Authentication workflow:
    1. Validate credentials
    2. Generate access token
    3. Return token to client
    
    Provides secure token-based authentication
    """
    # Authenticate user credentials
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    
    if not user:
        # Invalid credentials - return unauthorized error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Set token expiration
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create access token with username as subject
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Return token to client
    return Token(access_token=access_token, token_type="bearer")

@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """
    Protected endpoint to retrieve current user's information
    
    Requires:
    1. Valid access token
    2. Active user account
    """
    return current_user

@app.get("/users/me/items/")
async def read_own_items(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """
    Protected endpoint to retrieve user-specific items
    
    Requires:
    1. Valid access token
    2. Active user account
    
    Returns personalized content based on authenticated user
    """
    return [{"item_id": "Foo", "owner": current_user.username}]