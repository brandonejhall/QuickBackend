from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.asset import Asset, AssetStatus, AssetType, CostEvent
from app.schemas.dashboard import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_assets = db.query(func.count(Asset.id)).scalar() or 0

    total_portfolio_value = (
        db.query(func.sum(Asset.purchase_price))
        .scalar()
    ) or Decimal("0")

    total_mortgage_balance = (
        db.query(func.sum(Asset.mortgage_balance))
        .filter(Asset.has_mortgage.is_(True))
        .scalar()
    ) or Decimal("0")

    total_monthly_rental_income = (
        db.query(func.sum(Asset.rental_monthly_income))
        .filter(Asset.has_rental.is_(True))
        .scalar()
    ) or Decimal("0")

    # Assets by type
    type_rows = (
        db.query(Asset.type, func.count(Asset.id))
        .group_by(Asset.type)
        .all()
    )
    assets_by_type = {row[0].value: row[1] for row in type_rows}

    # Assets by status
    status_rows = (
        db.query(Asset.status, func.count(Asset.id))
        .group_by(Asset.status)
        .all()
    )
    assets_by_status = {row[0].value: row[1] for row in status_rows}

    # Assets needing attention
    attention_statuses = [AssetStatus.UNDER_RENOVATION, AssetStatus.IN_MAINTENANCE]
    assets_needing_attention = (
        db.query(func.count(Asset.id))
        .filter(Asset.status.in_(attention_statuses))
        .scalar()
    ) or 0

    return DashboardStats(
        total_assets=total_assets,
        total_portfolio_value=str(total_portfolio_value),
        total_mortgage_balance=str(total_mortgage_balance),
        total_monthly_rental_income=str(total_monthly_rental_income),
        assets_by_type=assets_by_type,
        assets_by_status=assets_by_status,
        assets_needing_attention=assets_needing_attention,
    )
