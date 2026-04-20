from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db_user
from app.database import get_db
from app.models.activity_log import ActivityEventType, ActivityLog
from app.models.user import UserRole
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter()


@router.get("/", response_model=List[ActivityLogResponse])
async def list_activity_feed(
    event_type: Optional[ActivityEventType] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user = get_db_user(current_user_email, db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can access the activity feed")

    query = db.query(ActivityLog)

    if event_type is not None:
        query = query.filter(ActivityLog.event_type == event_type)

    entries = (
        query.order_by(ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return entries
