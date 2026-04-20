from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.models.asset import (
    AssetStatus,
    AssetType,
    CostCategory,
    ConditionRating,
    LotSizeUnit,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_decimal(value: Optional[str]) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        raise ValueError(f"Invalid numeric value: {value!r}")


def _from_decimal(value: Optional[Decimal]) -> Optional[str]:
    if value is None:
        return None
    return str(value)


# ---------------------------------------------------------------------------
# Nested mortgage / rental objects (used in API request + response)
# ---------------------------------------------------------------------------

class MortgageInfo(BaseModel):
    lender: str
    balance: str
    monthly_payment: str


class RentalInfo(BaseModel):
    monthly_income: str
    tenant_name: str
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None


# ---------------------------------------------------------------------------
# Asset
# ---------------------------------------------------------------------------

class AssetBase(BaseModel):
    name: str
    type: AssetType
    street: str
    parish: str
    country: str = "Jamaica"
    registry_number: Optional[str] = None
    lot_size: Optional[str] = None
    lot_size_unit: Optional[LotSizeUnit] = None
    build_year: Optional[str] = None
    external_ref_id: Optional[str] = None
    comments: Optional[str] = None
    status: AssetStatus
    owner_name: Optional[str] = None
    acquisition_date: Optional[date] = None
    purchase_price: Optional[str] = None
    has_mortgage: bool = False
    mortgage: Optional[MortgageInfo] = None
    has_rental: bool = False
    rental: Optional[RentalInfo] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AssetType] = None
    street: Optional[str] = None
    parish: Optional[str] = None
    country: Optional[str] = None
    registry_number: Optional[str] = None
    lot_size: Optional[str] = None
    lot_size_unit: Optional[LotSizeUnit] = None
    build_year: Optional[str] = None
    external_ref_id: Optional[str] = None
    comments: Optional[str] = None
    status: Optional[AssetStatus] = None
    owner_name: Optional[str] = None
    acquisition_date: Optional[date] = None
    purchase_price: Optional[str] = None
    has_mortgage: Optional[bool] = None
    mortgage: Optional[MortgageInfo] = None
    has_rental: Optional[bool] = None
    rental: Optional[RentalInfo] = None


# ---------------------------------------------------------------------------
# Sub-resource schemas
# ---------------------------------------------------------------------------

class ConditionEntryCreate(BaseModel):
    date: date
    rating: ConditionRating
    note: Optional[str] = None


class ConditionEntryResponse(ConditionEntryCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UnitCreate(BaseModel):
    name: str
    status: AssetStatus
    tenant_name: Optional[str] = None
    monthly_rent: Optional[str] = None


class UnitUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[AssetStatus] = None
    tenant_name: Optional[str] = None
    monthly_rent: Optional[str] = None


class UnitResponse(BaseModel):
    id: int
    name: str
    status: AssetStatus
    tenant_name: Optional[str] = None
    monthly_rent: Optional[str] = None

    @field_validator("monthly_rent", mode="before")
    @classmethod
    def coerce_monthly_rent(cls, v):
        return _from_decimal(v) if isinstance(v, Decimal) else v

    class Config:
        from_attributes = True


class EquipmentCreate(BaseModel):
    name: str
    condition: ConditionRating
    install_date: Optional[date] = None
    last_service_date: Optional[date] = None
    next_service_due: Optional[date] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    condition: Optional[ConditionRating] = None
    install_date: Optional[date] = None
    last_service_date: Optional[date] = None
    next_service_due: Optional[date] = None


class EquipmentResponse(EquipmentCreate):
    id: int

    class Config:
        from_attributes = True


class AssetDocumentResponse(BaseModel):
    id: int
    name: str
    size: Optional[str] = None
    uploaded_at: datetime
    blob_url: Optional[str] = None

    class Config:
        from_attributes = True


class CostEventCreate(BaseModel):
    date: date
    category: CostCategory
    description: Optional[str] = None
    amount: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        _to_decimal(v)  # raises if invalid
        return v


class CostEventResponse(BaseModel):
    id: int
    asset_id: int
    date: date
    category: CostCategory
    description: Optional[str] = None
    amount: str
    created_at: datetime

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, v):
        return _from_decimal(v) if isinstance(v, Decimal) else v

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Full asset response (nested sub-resources + reconstructed mortgage/rental)
# ---------------------------------------------------------------------------

class AssetResponse(BaseModel):
    id: int
    name: str
    type: AssetType
    street: str
    parish: str
    country: str
    registry_number: Optional[str] = None
    lot_size: Optional[str] = None
    lot_size_unit: Optional[LotSizeUnit] = None
    build_year: Optional[str] = None
    external_ref_id: Optional[str] = None
    comments: Optional[str] = None
    status: AssetStatus
    owner_name: Optional[str] = None
    acquisition_date: Optional[date] = None
    purchase_price: Optional[str] = None
    has_mortgage: bool
    mortgage: Optional[MortgageInfo] = None
    has_rental: bool
    rental: Optional[RentalInfo] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    condition_log: List[ConditionEntryResponse] = []
    units: List[UnitResponse] = []
    equipment: List[EquipmentResponse] = []
    documents: List[AssetDocumentResponse] = []
    cost_events: List[CostEventResponse] = []

    @field_validator("purchase_price", mode="before")
    @classmethod
    def coerce_purchase_price(cls, v):
        return _from_decimal(v) if isinstance(v, Decimal) else v

    class Config:
        from_attributes = True


# Lightweight version for list endpoints (no sub-resources)
class AssetSummary(BaseModel):
    id: int
    name: str
    type: AssetType
    street: str
    parish: str
    country: str
    status: AssetStatus
    owner_name: Optional[str] = None
    purchase_price: Optional[str] = None
    has_mortgage: bool
    has_rental: bool
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("purchase_price", mode="before")
    @classmethod
    def coerce_purchase_price(cls, v):
        return _from_decimal(v) if isinstance(v, Decimal) else v

    class Config:
        from_attributes = True


__all__ = [
    "MortgageInfo", "RentalInfo",
    "AssetCreate", "AssetUpdate", "AssetResponse", "AssetSummary",
    "ConditionEntryCreate", "ConditionEntryResponse",
    "UnitCreate", "UnitUpdate", "UnitResponse",
    "EquipmentCreate", "EquipmentUpdate", "EquipmentResponse",
    "AssetDocumentResponse",
    "CostEventCreate", "CostEventResponse",
]
