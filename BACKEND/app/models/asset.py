import enum
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel


class AssetType(str, enum.Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    LAND = "Land"
    MIXED_USE = "Mixed Use"
    VEHICLE = "Vehicle"
    EQUIPMENT_ASSET = "Equipment"
    OTHER = "Other"


class AssetStatus(str, enum.Enum):
    OWNED = "Owned"
    MORTGAGED = "Mortgaged"
    TENANTED = "Tenanted"
    VACANT = "Vacant"
    UNDER_RENOVATION = "Under Renovation"
    LISTED_FOR_SALE = "Listed for Sale"
    DISPOSED = "Disposed"
    ACTIVE = "Active"
    IN_MAINTENANCE = "In Maintenance"


class ConditionRating(str, enum.Enum):
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    CRITICAL = "Critical"


class LotSizeUnit(str, enum.Enum):
    SQ_FT = "sq ft"
    SQ_M = "sq m"


class CostCategory(str, enum.Enum):
    PROPERTY_TAX = "Property Tax"
    MAINTENANCE_AND_REPAIR = "Maintenance and Repair"
    RENOVATION = "Renovation"
    INSURANCE_PREMIUM = "Insurance Premium"
    OTHER = "Other"


class Asset(SQLModel, table=True):
    __tablename__ = "assets"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: AssetType
    street: str
    parish: str
    country: str = Field(default="Jamaica")
    registry_number: Optional[str] = None
    lot_size: Optional[str] = None
    lot_size_unit: Optional[LotSizeUnit] = None
    build_year: Optional[str] = None
    external_ref_id: Optional[str] = None
    comments: Optional[str] = None
    status: AssetStatus = Field(default=AssetStatus.OWNED)
    owner_name: Optional[str] = None
    acquisition_date: Optional[date] = None
    purchase_price: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(15, 2)))

    # Mortgage (inline columns)
    has_mortgage: bool = Field(default=False)
    mortgage_lender: Optional[str] = None
    mortgage_balance: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(15, 2)))
    mortgage_monthly_payment: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(15, 2)))

    # Rental (inline columns)
    has_rental: bool = Field(default=False)
    rental_monthly_income: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(15, 2)))
    rental_tenant_name: Optional[str] = None
    rental_lease_start: Optional[date] = None
    rental_lease_end: Optional[date] = None

    # Photo
    photo_drive_id: Optional[str] = None
    photo_url: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    condition_log: List["ConditionEntry"] = Relationship(back_populates="asset")
    units: List["Unit"] = Relationship(back_populates="asset")
    equipment: List["AssetEquipment"] = Relationship(back_populates="asset")
    asset_documents: List["AssetDocument"] = Relationship(back_populates="asset")
    cost_events: List["CostEvent"] = Relationship(back_populates="asset")


class ConditionEntry(SQLModel, table=True):
    __tablename__ = "condition_entries"

    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.id")
    date: date
    rating: ConditionRating
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    asset: Optional[Asset] = Relationship(back_populates="condition_log")


class Unit(SQLModel, table=True):
    __tablename__ = "units"

    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.id")
    name: str
    status: AssetStatus
    tenant_name: Optional[str] = None
    monthly_rent: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(15, 2)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    asset: Optional[Asset] = Relationship(back_populates="units")


class AssetEquipment(SQLModel, table=True):
    __tablename__ = "asset_equipment"

    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.id")
    name: str
    condition: ConditionRating
    install_date: Optional[date] = None
    last_service_date: Optional[date] = None
    next_service_due: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    asset: Optional[Asset] = Relationship(back_populates="equipment")


class AssetDocument(SQLModel, table=True):
    __tablename__ = "asset_documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.id")
    name: str
    size: Optional[str] = None
    drive_file_id: str
    blob_url: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    asset: Optional[Asset] = Relationship(back_populates="asset_documents")


class CostEvent(SQLModel, table=True):
    __tablename__ = "cost_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="assets.id")
    date: date
    category: CostCategory
    description: Optional[str] = None
    amount: Decimal = Field(sa_column=Column(Numeric(15, 2)))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    asset: Optional[Asset] = Relationship(back_populates="cost_events")


__all__ = [
    "AssetType", "AssetStatus", "ConditionRating", "LotSizeUnit", "CostCategory",
    "Asset", "ConditionEntry", "Unit", "AssetEquipment", "AssetDocument", "CostEvent",
]
