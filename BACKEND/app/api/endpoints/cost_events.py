from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.asset import Asset, CostCategory, CostEvent
from app.schemas.asset import CostEventResponse

router = APIRouter()


class CostEventWithAsset(CostEventResponse):
    asset_name: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CostEventWithAsset])
async def list_all_cost_events(
    asset_id: Optional[int] = Query(default=None),
    category: Optional[CostCategory] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CostEvent).join(Asset, CostEvent.asset_id == Asset.id)

    if asset_id is not None:
        query = query.filter(CostEvent.asset_id == asset_id)
    if category is not None:
        query = query.filter(CostEvent.category == category)
    if start_date is not None:
        query = query.filter(CostEvent.date >= start_date)
    if end_date is not None:
        query = query.filter(CostEvent.date <= end_date)

    events = query.order_by(CostEvent.date.desc()).all()

    results = []
    for event in events:
        results.append(CostEventWithAsset(
            id=event.id,
            asset_id=event.asset_id,
            asset_name=event.asset.name,
            date=event.date,
            category=event.category,
            description=event.description,
            amount=str(event.amount),
            created_at=event.created_at,
        ))
    return results
