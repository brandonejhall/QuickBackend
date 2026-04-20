from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db_user
from app.database import get_db
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_db_user(current_user_email, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
