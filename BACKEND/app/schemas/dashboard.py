from typing import Dict

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_assets: int
    total_portfolio_value: str
    total_mortgage_balance: str
    total_monthly_rental_income: str
    assets_by_type: Dict[str, int]
    assets_by_status: Dict[str, int]
    assets_needing_attention: int


__all__ = ["DashboardStats"]
