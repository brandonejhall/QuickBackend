from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.activity_log import ActivityEventType, ActivityStatus


class ActivityLogResponse(BaseModel):
    id: int
    event_type: ActivityEventType
    user_email: Optional[str] = None
    action: str
    target: str
    asset_id: Optional[int] = None
    status: ActivityStatus
    created_at: datetime

    class Config:
        from_attributes = True


__all__ = ["ActivityLogResponse"]
