# BRIMS Backend Migration — Session Log

This document records the backend work completed to support the `FRONTEND_MIGRATION` replacing the existing `FRONTEND`. All changes were made to the `BACKEND` directory of this repository.

---

## Context

The existing system is a document management application (FastAPI + Next.js 15 + PostgreSQL + Google Drive). The goal is to evolve it into BRIMS — Bold Realty Investment and Management Services — a full asset management platform.

The `FRONTEND_MIGRATION` directory contains a new React 19 + Vite frontend for BRIMS. It was previously running entirely on `localStorage`. This session built out all backend API support required to replace that with real persistence.

---

## Phase 1 — Models & Database

**New files:**
- `BACKEND/app/models/asset.py`
- `BACKEND/app/models/activity_log.py`

**Modified files:**
- `BACKEND/app/models/__init__.py`
- `BACKEND/alembic/env.py`

### New tables created

| Table | Description |
|---|---|
| `assets` | Core asset record. Stores all property fields including inline mortgage and rental columns |
| `condition_entries` | Condition log entries per asset (rating + note + date) |
| `units` | Sub-units within an asset (e.g. apartments in a building) |
| `asset_equipment` | Physical equipment tracked per asset with service dates |
| `asset_documents` | Document metadata per asset; file stored in Google Drive |
| `cost_events` | Financial cost entries per asset (tax, maintenance, insurance, etc.) |
| `activity_log` | Append-only audit log of all write operations across the system |

### New enums

| Enum | Values |
|---|---|
| `AssetType` | Residential, Commercial, Industrial, Land, Mixed Use, Vehicle, Equipment, Other |
| `AssetStatus` | Owned, Mortgaged, Tenanted, Vacant, Under Renovation, Listed for Sale, Disposed, Active, In Maintenance |
| `ConditionRating` | Good, Fair, Poor, Critical |
| `LotSizeUnit` | sq ft, sq m |
| `CostCategory` | Property Tax, Maintenance and Repair, Renovation, Insurance Premium, Other |
| `ActivityEventType` | Document Upload, Cost Event, Asset Update, User Login, System Alert |
| `ActivityStatus` | success, warning, error, info |

### Design decisions

- **Mortgage and rental stored as flat columns on `assets`** rather than separate tables. Both are 1:1 with an asset and never queried independently, so a join table adds complexity without benefit. They are reconstructed as nested objects in the API response.
- **`activity_log` has no cascade delete** on `asset_id`. Log entries are intentionally preserved even when an asset is deleted (audit trail).
- **All monetary values** use `Numeric(15, 2)` in PostgreSQL. They are accepted and returned as strings in the API to avoid floating-point issues in the frontend.

### Database setup

The existing migration history had conflicts when applied to a fresh database. Rather than fixing the broken migration chain, all tables were created directly via `SQLModel.metadata.create_all(engine)` and alembic was stamped at head. Future schema changes should use `alembic revision --autogenerate`.

```bash
# Database: brims (PostgreSQL, port 5432, user: brandonhall)
# Created via: psql -U brandonhall -c "CREATE DATABASE brims;" postgres
# Tables created via: SQLModel.metadata.create_all(engine)
# Alembic stamped via: alembic stamp head
```

---

## Phase 2 — Schemas

**New files:**
- `BACKEND/app/schemas/asset.py`
- `BACKEND/app/schemas/activity_log.py`
- `BACKEND/app/schemas/dashboard.py`

**Modified files:**
- `BACKEND/app/schemas/user.py` — added `role` field to `UserResponse`
- `BACKEND/app/schemas/__init__.py` — exports all new schemas

### Schema classes

**`schemas/asset.py`**

| Class | Purpose |
|---|---|
| `MortgageInfo` | Nested mortgage object (lender, balance, monthly_payment) |
| `RentalInfo` | Nested rental object (monthly_income, tenant_name, lease dates) |
| `AssetCreate` | Request body for `POST /assets/` |
| `AssetUpdate` | Request body for `PATCH /assets/{id}` — all fields optional |
| `AssetResponse` | Full asset response including all sub-resource arrays |
| `AssetSummary` | Lightweight response for list endpoints — no sub-resources |
| `ConditionEntryCreate` / `ConditionEntryResponse` | Condition log |
| `UnitCreate` / `UnitUpdate` / `UnitResponse` | Units |
| `EquipmentCreate` / `EquipmentUpdate` / `EquipmentResponse` | Equipment |
| `AssetDocumentResponse` | Document metadata (no create schema — uploaded via multipart) |
| `CostEventCreate` / `CostEventResponse` | Cost events |

**`schemas/activity_log.py`**
- `ActivityLogResponse`

**`schemas/dashboard.py`**
- `DashboardStats` — total_assets, total_portfolio_value, total_mortgage_balance, total_monthly_rental_income, assets_by_type, assets_by_status, assets_needing_attention

### Design decisions

- **`AssetSummary` vs `AssetResponse`**: The list endpoint returns `AssetSummary` (no nested arrays) to avoid loading all sub-resources for every asset on the dashboard. The detail endpoint returns the full `AssetResponse`.
- **Decimal coercion**: `Decimal` DB values are coerced to `str` in responses via `@field_validator` on the relevant response classes. This prevents JSON serialization errors and matches what the frontend expects.
- **`uploaded_at` field name**: `AssetDocumentResponse` uses `uploaded_at` (matching the ORM model field) rather than `uploadDate` from the original frontend types. The frontend field mapping is documented in `MIGRATION_STEPS.md`.

---

## Phase 3 — Core Endpoints

**New files:**
- `BACKEND/app/api/endpoints/users.py`
- `BACKEND/app/api/endpoints/assets.py`

**Modified files:**
- `BACKEND/app/api/auth.py` — login now writes an `ActivityLog` entry

### `GET /api/users/me`

Returns the current authenticated user's profile including role. Uses the existing `get_current_user` dependency from `app.dependencies` and `get_db_user` from `app.core.security`.

### `POST /api/auth/login` (modified)

After successful authentication, inserts an `ActivityLog` entry with `event_type=USER_LOGIN` within the same transaction as the token response.

### `/api/assets/` — 18 endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/assets/` | List all assets as `AssetSummary[]` |
| `POST` | `/assets/` | Create asset, returns full `AssetResponse` |
| `GET` | `/assets/{id}` | Full asset detail with all sub-resources |
| `PATCH` | `/assets/{id}` | Partial update via `model_dump(exclude_unset=True)` |
| `DELETE` | `/assets/{id}` | Delete asset and all related records (cascade) |
| `POST` | `/assets/{id}/photo` | Upload photo to Drive folder `assets/{id}/photos/` |
| `GET` | `/assets/{id}/condition-log` | List condition entries, newest first |
| `POST` | `/assets/{id}/condition-log` | Add condition entry |
| `GET` | `/assets/{id}/units` | List units |
| `POST` | `/assets/{id}/units` | Add unit |
| `PATCH` | `/assets/{id}/units/{unit_id}` | Update a unit |
| `GET` | `/assets/{id}/equipment` | List equipment |
| `POST` | `/assets/{id}/equipment` | Add equipment |
| `PATCH` | `/assets/{id}/equipment/{eq_id}` | Update equipment |
| `GET` | `/assets/{id}/documents` | List documents, newest first |
| `POST` | `/assets/{id}/documents` | Upload document to Drive folder `assets/{id}/documents/` |
| `GET` | `/assets/{id}/costs` | List cost events, newest first |
| `POST` | `/assets/{id}/costs` | Add cost event |

**Key implementation details:**

- `_log()` helper appends an `ActivityLog` entry to the session without committing. The caller's `db.commit()` commits both the main operation and the log entry atomically.
- `_apply_asset_data()` handles flattening nested `mortgage`/`rental` objects from the request into the flat DB columns, and clearing those columns when `has_mortgage`/`has_rental` is set to false.
- `_build_response()` reconstructs nested `MortgageInfo`/`RentalInfo` objects from flat columns for the API response.
- `_format_size()` converts raw byte count to a human-readable string (e.g. `"1.2 MB"`) stored alongside each document record.
- All endpoints require authentication. No endpoints are public.
- All endpoints require `admin` role. No role restriction is applied at the asset level — all authenticated users can manage all assets.

---

## Phase 4 — Supporting Endpoints & Router Wiring

**New files:**
- `BACKEND/app/api/endpoints/dashboard.py`
- `BACKEND/app/api/endpoints/cost_events.py`
- `BACKEND/app/api/endpoints/activity.py`

**Modified files:**
- `BACKEND/app/api/router.py` — registered all 5 new routers

### `GET /api/dashboard/stats`

Uses SQLAlchemy aggregate functions (`func.sum`, `func.count`) directly — no N+1 queries. Returns portfolio-wide KPIs in a single response. Available to all authenticated users.

### `GET /api/cost-events/`

Returns all cost events across all assets. Supports optional query parameters:
- `asset_id` — filter to one asset
- `category` — filter by cost category
- `start_date` / `end_date` — date range filter

Response extends `CostEventResponse` with an `asset_name` field joined from the `assets` table.

### `GET /api/activity-feed/`

Admin-only. Supports:
- `event_type` — filter by activity type
- `limit` — max results (1–200, default 50)
- `offset` — for pagination

Returns entries ordered by `created_at DESC`.

### Router registration

All new routers registered in `BACKEND/app/api/router.py`:

```
/api/assets/        → endpoints/assets.py
/api/dashboard/     → endpoints/dashboard.py
/api/cost-events/   → endpoints/cost_events.py
/api/activity-feed/ → endpoints/activity.py
/api/users/         → endpoints/users.py
```

---

## Full File Change Summary

| File | Status | Phase |
|---|---|---|
| `app/models/asset.py` | Created | 1 |
| `app/models/activity_log.py` | Created | 1 |
| `app/models/__init__.py` | Modified | 1 |
| `alembic/env.py` | Modified | 1 |
| `app/schemas/asset.py` | Created | 2 |
| `app/schemas/activity_log.py` | Created | 2 |
| `app/schemas/dashboard.py` | Created | 2 |
| `app/schemas/user.py` | Modified | 2 |
| `app/schemas/__init__.py` | Modified | 2 |
| `app/api/endpoints/users.py` | Created | 3 |
| `app/api/endpoints/assets.py` | Created | 3 |
| `app/api/auth.py` | Modified | 3 |
| `app/api/endpoints/dashboard.py` | Created | 4 |
| `app/api/endpoints/cost_events.py` | Created | 4 |
| `app/api/endpoints/activity.py` | Created | 4 |
| `app/api/router.py` | Modified | 4 |
| `.env` | Created | — |

---

## What Was Not Changed

- `BACKEND/app/api/document_management.py` — existing document management for the current frontend is untouched
- `BACKEND/app/api/endpoints/project_notes.py` — untouched
- `FRONTEND/` — the existing Next.js frontend is untouched
- All existing migration files in `alembic/versions/` — untouched (history preserved)

---

## Running the Backend

```bash
cd BACKEND
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

To create an admin user for testing, register via `POST /api/auth/signup` and then manually update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
