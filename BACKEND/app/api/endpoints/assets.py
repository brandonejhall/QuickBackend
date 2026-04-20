import io
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db_user
from app.database import get_db
from app.dependencies import get_drive_file_ops
from app.googledrivefunc.fileoperations import DriveFileOperations
from app.models.asset import (
    Asset, AssetDocument, AssetEquipment, AssetStatus, AssetType,
    ConditionEntry, CostCategory, CostEvent, LotSizeUnit, Unit,
)
from app.models.activity_log import ActivityLog, ActivityEventType, ActivityStatus
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetSummary,
    AssetDocumentResponse,
    ConditionEntryCreate, ConditionEntryResponse,
    CostEventCreate, CostEventResponse,
    EquipmentCreate, EquipmentUpdate, EquipmentResponse,
    MortgageInfo, RentalInfo,
    UnitCreate, UnitUpdate, UnitResponse,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log(
    db: Session,
    event_type: ActivityEventType,
    user_email: str,
    action: str,
    target: str,
    asset_id: Optional[int] = None,
    status: ActivityStatus = ActivityStatus.SUCCESS,
):
    """Append an activity entry to the session without committing."""
    db.add(ActivityLog(
        event_type=event_type,
        user_email=user_email,
        action=action,
        target=target,
        asset_id=asset_id,
        status=status,
    ))


def _get_asset_or_404(asset_id: int, db: Session) -> Asset:
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


def _apply_asset_data(asset: Asset, data: AssetCreate | AssetUpdate):
    """Write flat fields and expand nested mortgage/rental onto the ORM object."""
    updates = data.model_dump(exclude_unset=True, exclude={"mortgage", "rental"})
    for key, value in updates.items():
        if key == "purchase_price" and value is not None:
            setattr(asset, key, Decimal(value))
        else:
            setattr(asset, key, value)

    # Mortgage
    if "has_mortgage" in updates or data.mortgage is not None:
        if asset.has_mortgage and data.mortgage:
            asset.mortgage_lender = data.mortgage.lender
            asset.mortgage_balance = Decimal(data.mortgage.balance)
            asset.mortgage_monthly_payment = Decimal(data.mortgage.monthly_payment)
        elif not asset.has_mortgage:
            asset.mortgage_lender = None
            asset.mortgage_balance = None
            asset.mortgage_monthly_payment = None

    # Rental
    if "has_rental" in updates or data.rental is not None:
        if asset.has_rental and data.rental:
            asset.rental_monthly_income = Decimal(data.rental.monthly_income)
            asset.rental_tenant_name = data.rental.tenant_name
            asset.rental_lease_start = data.rental.lease_start
            asset.rental_lease_end = data.rental.lease_end
        elif not asset.has_rental:
            asset.rental_monthly_income = None
            asset.rental_tenant_name = None
            asset.rental_lease_start = None
            asset.rental_lease_end = None


def _build_response(asset: Asset) -> AssetResponse:
    """Reconstruct nested mortgage/rental objects and return a validated response."""
    mortgage = None
    if asset.has_mortgage and asset.mortgage_lender:
        mortgage = MortgageInfo(
            lender=asset.mortgage_lender,
            balance=str(asset.mortgage_balance or "0"),
            monthly_payment=str(asset.mortgage_monthly_payment or "0"),
        )

    rental = None
    if asset.has_rental and asset.rental_tenant_name:
        rental = RentalInfo(
            monthly_income=str(asset.rental_monthly_income or "0"),
            tenant_name=asset.rental_tenant_name,
            lease_start=asset.rental_lease_start,
            lease_end=asset.rental_lease_end,
        )

    return AssetResponse(
        id=asset.id,
        name=asset.name,
        type=asset.type,
        street=asset.street,
        parish=asset.parish,
        country=asset.country,
        registry_number=asset.registry_number,
        lot_size=asset.lot_size,
        lot_size_unit=asset.lot_size_unit,
        build_year=asset.build_year,
        external_ref_id=asset.external_ref_id,
        comments=asset.comments,
        status=asset.status,
        owner_name=asset.owner_name,
        acquisition_date=asset.acquisition_date,
        purchase_price=str(asset.purchase_price) if asset.purchase_price is not None else None,
        has_mortgage=asset.has_mortgage,
        mortgage=mortgage,
        has_rental=asset.has_rental,
        rental=rental,
        photo_url=asset.photo_url,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        condition_log=[ConditionEntryResponse.model_validate(e) for e in asset.condition_log],
        units=[UnitResponse.model_validate(u) for u in asset.units],
        equipment=[EquipmentResponse.model_validate(e) for e in asset.equipment],
        documents=[AssetDocumentResponse.model_validate(d) for d in asset.asset_documents],
        cost_events=[CostEventResponse.model_validate(c) for c in asset.cost_events],
    )


def _format_size(num_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


# ---------------------------------------------------------------------------
# Assets CRUD
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[AssetSummary])
async def list_assets(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assets = db.query(Asset).order_by(Asset.created_at.desc()).all()
    summaries = []
    for a in assets:
        summaries.append(AssetSummary(
            id=a.id,
            name=a.name,
            type=a.type,
            street=a.street,
            parish=a.parish,
            country=a.country,
            status=a.status,
            owner_name=a.owner_name,
            purchase_price=str(a.purchase_price) if a.purchase_price is not None else None,
            has_mortgage=a.has_mortgage,
            has_rental=a.has_rental,
            photo_url=a.photo_url,
            created_at=a.created_at,
            updated_at=a.updated_at,
        ))
    return summaries


@router.post("/", response_model=AssetResponse, status_code=201)
async def create_asset(
    data: AssetCreate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = Asset()
    _apply_asset_data(asset, data)
    asset.created_at = datetime.utcnow()
    asset.updated_at = datetime.utcnow()
    db.add(asset)
    db.flush()  # get the id before logging
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Created asset {asset.name}", asset.name, asset.id)
    db.commit()
    db.refresh(asset)
    return _build_response(asset)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    return _build_response(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    data: AssetUpdate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    _apply_asset_data(asset, data)
    asset.updated_at = datetime.utcnow()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Updated asset {asset.name}", asset.name, asset.id, ActivityStatus.INFO)
    db.commit()
    db.refresh(asset)
    return _build_response(asset)


@router.delete("/{asset_id}", status_code=200)
async def delete_asset(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    name = asset.name
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Deleted asset {name}", name, asset_id, ActivityStatus.INFO)
    db.delete(asset)
    db.commit()
    return {"message": f"Asset '{name}' deleted successfully"}


# ---------------------------------------------------------------------------
# Photo upload
# ---------------------------------------------------------------------------

@router.post("/{asset_id}/photo", response_model=AssetResponse)
async def upload_asset_photo(
    asset_id: int,
    file: UploadFile = File(...),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
):
    asset = _get_asset_or_404(asset_id, db)
    content = await file.read()
    result = drive_ops.check_and_save_file(
        file.filename, io.BytesIO(content), f"assets/{asset_id}/photos"
    )
    if not result:
        raise HTTPException(status_code=500, detail="Photo upload to Drive failed")

    asset.photo_drive_id = result["file"]["id"]
    asset.photo_url = result["file"]["web_link"]
    asset.updated_at = datetime.utcnow()
    _log(db, ActivityEventType.DOCUMENT_UPLOAD, current_user_email,
         f"Uploaded photo for {asset.name}", asset.name, asset_id)
    db.commit()
    db.refresh(asset)
    return _build_response(asset)


# ---------------------------------------------------------------------------
# Condition log
# ---------------------------------------------------------------------------

@router.get("/{asset_id}/condition-log", response_model=List[ConditionEntryResponse])
async def get_condition_log(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    entries = (
        db.query(ConditionEntry)
        .filter(ConditionEntry.asset_id == asset_id)
        .order_by(ConditionEntry.date.desc())
        .all()
    )
    return entries


@router.post("/{asset_id}/condition-log", response_model=ConditionEntryResponse, status_code=201)
async def add_condition_entry(
    asset_id: int,
    data: ConditionEntryCreate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    entry = ConditionEntry(asset_id=asset_id, **data.model_dump())
    db.add(entry)
    db.flush()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Logged condition: {data.rating.value}", asset.name, asset_id)
    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Units
# ---------------------------------------------------------------------------

@router.get("/{asset_id}/units", response_model=List[UnitResponse])
async def get_units(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    return db.query(Unit).filter(Unit.asset_id == asset_id).all()


@router.post("/{asset_id}/units", response_model=UnitResponse, status_code=201)
async def add_unit(
    asset_id: int,
    data: UnitCreate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    unit_data = data.model_dump()
    if unit_data.get("monthly_rent") is not None:
        unit_data["monthly_rent"] = Decimal(unit_data["monthly_rent"])
    unit = Unit(asset_id=asset_id, **unit_data)
    db.add(unit)
    db.flush()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Added unit {unit.name}", asset.name, asset_id)
    db.commit()
    db.refresh(unit)
    return unit


@router.patch("/{asset_id}/units/{unit_id}", response_model=UnitResponse)
async def update_unit(
    asset_id: int,
    unit_id: int,
    data: UnitUpdate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    unit = db.get(Unit, unit_id)
    if not unit or unit.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Unit not found")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "monthly_rent" and value is not None:
            setattr(unit, key, Decimal(value))
        else:
            setattr(unit, key, value)
    unit.updated_at = datetime.utcnow()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Updated unit {unit.name}", asset.name, asset_id, ActivityStatus.INFO)
    db.commit()
    db.refresh(unit)
    return unit


# ---------------------------------------------------------------------------
# Equipment
# ---------------------------------------------------------------------------

@router.get("/{asset_id}/equipment", response_model=List[EquipmentResponse])
async def get_equipment(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    return db.query(AssetEquipment).filter(AssetEquipment.asset_id == asset_id).all()


@router.post("/{asset_id}/equipment", response_model=EquipmentResponse, status_code=201)
async def add_equipment(
    asset_id: int,
    data: EquipmentCreate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    equipment = AssetEquipment(asset_id=asset_id, **data.model_dump())
    db.add(equipment)
    db.flush()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Added equipment {equipment.name}", asset.name, asset_id)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.patch("/{asset_id}/equipment/{eq_id}", response_model=EquipmentResponse)
async def update_equipment(
    asset_id: int,
    eq_id: int,
    data: EquipmentUpdate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    equipment = db.get(AssetEquipment, eq_id)
    if not equipment or equipment.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Equipment not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(equipment, key, value)
    equipment.updated_at = datetime.utcnow()
    _log(db, ActivityEventType.ASSET_UPDATE, current_user_email,
         f"Updated equipment {equipment.name}", asset.name, asset_id, ActivityStatus.INFO)
    db.commit()
    db.refresh(equipment)
    return equipment


# ---------------------------------------------------------------------------
# Asset documents
# ---------------------------------------------------------------------------

@router.get("/{asset_id}/documents", response_model=List[AssetDocumentResponse])
async def get_asset_documents(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    return (
        db.query(AssetDocument)
        .filter(AssetDocument.asset_id == asset_id)
        .order_by(AssetDocument.uploaded_at.desc())
        .all()
    )


@router.post("/{asset_id}/documents", response_model=AssetDocumentResponse, status_code=201)
async def upload_asset_document(
    asset_id: int,
    file: UploadFile = File(...),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
):
    asset = _get_asset_or_404(asset_id, db)
    content = await file.read()
    result = drive_ops.check_and_save_file(
        file.filename, io.BytesIO(content), f"assets/{asset_id}/documents"
    )
    if not result:
        raise HTTPException(status_code=500, detail="Document upload to Drive failed")

    doc = AssetDocument(
        asset_id=asset_id,
        name=file.filename,
        size=_format_size(len(content)),
        drive_file_id=result["file"]["id"],
        blob_url=result["file"]["web_link"],
    )
    db.add(doc)
    db.flush()
    _log(db, ActivityEventType.DOCUMENT_UPLOAD, current_user_email,
         f"Uploaded {file.filename}", asset.name, asset_id)
    db.commit()
    db.refresh(doc)
    return doc


# ---------------------------------------------------------------------------
# Cost events
# ---------------------------------------------------------------------------

@router.get("/{asset_id}/costs", response_model=List[CostEventResponse])
async def get_cost_events(
    asset_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    return (
        db.query(CostEvent)
        .filter(CostEvent.asset_id == asset_id)
        .order_by(CostEvent.date.desc())
        .all()
    )


@router.delete("/{asset_id}/condition-log/{entry_id}", status_code=200)
async def delete_condition_entry(
    asset_id: int,
    entry_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    entry = db.get(ConditionEntry, entry_id)
    if not entry or entry.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Condition entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Condition entry deleted"}


@router.delete("/{asset_id}/units/{unit_id}", status_code=200)
async def delete_unit(
    asset_id: int,
    unit_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    unit = db.get(Unit, unit_id)
    if not unit or unit.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}


@router.delete("/{asset_id}/equipment/{eq_id}", status_code=200)
async def delete_equipment_item(
    asset_id: int,
    eq_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    equipment = db.get(AssetEquipment, eq_id)
    if not equipment or equipment.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(equipment)
    db.commit()
    return {"message": "Equipment deleted"}


@router.delete("/{asset_id}/documents/{doc_id}", status_code=200)
async def delete_asset_document(
    asset_id: int,
    doc_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    doc = db.get(AssetDocument, doc_id)
    if not doc or doc.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


@router.delete("/{asset_id}/costs/{cost_id}", status_code=200)
async def delete_cost_event(
    asset_id: int,
    cost_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_asset_or_404(asset_id, db)
    event = db.get(CostEvent, cost_id)
    if not event or event.asset_id != asset_id:
        raise HTTPException(status_code=404, detail="Cost event not found")
    db.delete(event)
    db.commit()
    return {"message": "Cost event deleted"}


@router.post("/{asset_id}/costs", response_model=CostEventResponse, status_code=201)
async def add_cost_event(
    asset_id: int,
    data: CostEventCreate,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = _get_asset_or_404(asset_id, db)
    event = CostEvent(
        asset_id=asset_id,
        date=data.date,
        category=data.category,
        description=data.description,
        amount=Decimal(data.amount),
    )
    db.add(event)
    db.flush()
    _log(db, ActivityEventType.COST_EVENT, current_user_email,
         f"Recorded {data.category.value}: {data.amount}", asset.name, asset_id)
    db.commit()
    db.refresh(event)
    return event
