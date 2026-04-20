import enum
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ActivityEventType(str, enum.Enum):
    DOCUMENT_UPLOAD = "Document Upload"
    COST_EVENT = "Cost Event"
    ASSET_UPDATE = "Asset Update"
    USER_LOGIN = "User Login"
    SYSTEM_ALERT = "System Alert"


class ActivityStatus(str, enum.Enum):
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    INFO = "info"


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_type: ActivityEventType
    user_email: Optional[str] = None
    action: str
    target: str
    asset_id: Optional[int] = Field(default=None, foreign_key="assets.id")
    status: ActivityStatus = Field(default=ActivityStatus.INFO)
    created_at: datetime = Field(default_factory=datetime.utcnow)


__all__ = ["ActivityEventType", "ActivityStatus", "ActivityLog"]
