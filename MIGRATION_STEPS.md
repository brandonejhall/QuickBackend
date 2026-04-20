# BRIMS Frontend Migration Steps

This document details everything needed to wire `FRONTEND_MIGRATION` to the `BACKEND` API and replace the current `FRONTEND`.

The backend API is complete. The frontend currently uses `localStorage` for all data. Each section below identifies what needs to change in the frontend and which API endpoint to use.

---

## Prerequisites

### 1. Backend running
```bash
cd BACKEND
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API will be at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 2. Google Drive credentials
Place your service account JSON at `BACKEND/credentials.json` and ensure `BACKEND/.env` has:
```
GOOGLE_CREDENTIALS_FILE=./credentials.json
SHARE_EMAIL=your-google-account@gmail.com
```

### 3. Frontend environment
Create `FRONTEND_MIGRATION/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Install an HTTP client
The frontend has no HTTP client dependency. Add one:
```bash
cd FRONTEND_MIGRATION
npm install axios
```

---

## Step 1 — API Client + Auth Token Management

Create `FRONTEND_MIGRATION/src/lib/api.ts`. This is the foundation everything else depends on.

**What to build:**
- An `axios` instance with `baseURL` set to `import.meta.env.VITE_API_URL`
- A request interceptor that reads the JWT from `localStorage` and attaches it as `Authorization: Bearer <token>`
- A response interceptor that redirects to `/login` on 401

```ts
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) window.location.href = '/login';
    return Promise.reject(err);
  }
);

export default api;
```

---

## Step 2 — Authentication (`Login.tsx`)

**File:** `src/pages/Login.tsx`

**Current state:** The form has `onSubmit={(e) => e.preventDefault()}` — it does nothing.

**What to change:**
1. Add `useState` for `email`, `password`, `error`, `loading`
2. On submit, call `POST /api/auth/login` with `{ email, password }`
3. Store the returned `access_token` in `localStorage` as `brims_token`
4. Store `role` in `localStorage` as `brims_role`
5. Navigate to `/dashboard` on success

**API call:**
```ts
// Endpoint: POST /api/auth/login
// Body: { email: string, password: string }
// Response: { access_token: string, token_type: string, role: "admin" | "user" }

const res = await api.post('/api/auth/login', { email, password });
localStorage.setItem('brims_token', res.data.access_token);
localStorage.setItem('brims_role', res.data.role);
navigate('/dashboard');
```

---

## Step 3 — Route Protection (`App.tsx`)

**File:** `src/App.tsx`

**Current state:** All routes are open — no auth check exists.

**What to build:**
Create a `ProtectedRoute` wrapper component that:
1. Reads `brims_token` from `localStorage`
2. Redirects to `/login` if missing
3. Optionally checks `brims_role === 'admin'` for admin-only routes (`/admin`, `/activity`)

```tsx
function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('brims_token');
  const role = localStorage.getItem('brims_role');
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
```

Wrap all routes (except `/login`) with `<ProtectedRoute>`.

---

## Step 4 — User Dashboard (`UserDashboard.tsx`)

**File:** `src/pages/UserDashboard.tsx`

**Current state:** Reads assets from `localStorage.getItem('brims_assets')` and seeds a hardcoded demo asset if empty. KPIs are computed client-side. Recent documents are hardcoded mock data.

**What to change:**

### 4a. Asset list
Replace the `useEffect` localStorage read with:
```ts
// GET /api/assets/
// Response: AssetSummary[] — id, name, type, street, parish, status, purchase_price,
//           has_mortgage, has_rental, photo_url, created_at, updated_at
const res = await api.get('/api/assets/');
setAssets(res.data);
```
Remove the `DEMO_ASSET_MIN` seed — the API returns real data.

### 4b. KPI cards
Replace the client-side KPI calculations with:
```ts
// GET /api/dashboard/stats
// Response: { total_assets, total_portfolio_value, total_mortgage_balance,
//             total_monthly_rental_income, assets_by_type, assets_by_status,
//             assets_needing_attention }
const res = await api.get('/api/dashboard/stats');
setStats(res.data);
```

**Field name changes** (API uses snake_case):
- `purchasePrice` → `purchase_price`
- `hasRental` → `has_rental`
- `rental.monthlyIncome` → `rental.monthly_income`

### 4c. Document upload widget
Replace the local `uploadedFiles` state with a real upload call. The upload in the dashboard is portfolio-level, not asset-scoped — either prompt the user to select an asset or move this widget to `AssetDetail.tsx`. If keeping it here, disable upload until an asset is selected.

### 4d. Recent documents
Replace the three hardcoded mock documents with:
```ts
// GET /api/cost-events/ — use this for recent activity, or
// GET /api/activity-feed/ — for a recent docs feed (admin token required)
```

---

## Step 5 — Asset Wizard (`AssetWizard.tsx`)

**File:** `src/pages/AssetWizard.tsx`

**Current state:** On finish, saves asset to `localStorage` under key `brims_assets`.

**What to change:**
Replace the localStorage write with:
```ts
// POST /api/assets/
// Body: AssetCreate — all fields from types.ts, mortgage/rental as nested objects
// Response: AssetResponse with id assigned by the DB

const res = await api.post('/api/assets/', {
  name: formData.name,
  type: formData.type,
  street: formData.street,
  parish: formData.parish,
  country: formData.country,
  registry_number: formData.registryNumber,
  lot_size: formData.lotSize,
  lot_size_unit: formData.lotSizeUnit,
  build_year: formData.buildYear,
  external_ref_id: formData.externalRefId,
  comments: formData.comments,
  status: formData.status,
  owner_name: formData.ownerName,
  acquisition_date: formData.acquisitionDate,
  purchase_price: formData.purchasePrice,
  has_mortgage: formData.hasMortgage,
  mortgage: formData.hasMortgage ? {
    lender: formData.mortgage?.lender,
    balance: formData.mortgage?.balance,
    monthly_payment: formData.mortgage?.monthlyPayment,
  } : null,
  has_rental: formData.hasRental,
  rental: formData.hasRental ? {
    monthly_income: formData.rental?.monthlyIncome,
    tenant_name: formData.rental?.tenantName,
    lease_start: formData.rental?.leaseStart,
    lease_end: formData.rental?.leaseEnd,
  } : null,
});
navigate(`/assets/${res.data.id}`);
```

**Field name mapping** (frontend camelCase → API snake_case):

| Frontend (`types.ts`) | API body field |
|---|---|
| `registryNumber` | `registry_number` |
| `lotSize` | `lot_size` |
| `lotSizeUnit` | `lot_size_unit` |
| `buildYear` | `build_year` |
| `externalRefId` | `external_ref_id` |
| `ownerName` | `owner_name` |
| `acquisitionDate` | `acquisition_date` |
| `purchasePrice` | `purchase_price` |
| `hasMortgage` | `has_mortgage` |
| `mortgage.monthlyPayment` | `mortgage.monthly_payment` |
| `hasRental` | `has_rental` |
| `rental.monthlyIncome` | `rental.monthly_income` |
| `rental.tenantName` | `rental.tenant_name` |
| `rental.leaseStart` | `rental.lease_start` |
| `rental.leaseEnd` | `rental.lease_end` |

---

## Step 6 — Asset Detail (`AssetDetail.tsx`)

**File:** `src/pages/AssetDetail.tsx`

**Current state:** Reads a single asset by id from `localStorage`. All sub-resource tabs (condition log, units, equipment, documents, cost events) read from and write to the asset object in `localStorage`.

**What to change:**

### 6a. Load asset
```ts
// GET /api/assets/{id}
// Response: full AssetResponse including all sub-resources as nested arrays
const res = await api.get(`/api/assets/${id}`);
setAsset(res.data);
```
The response already contains `condition_log`, `units`, `equipment`, `documents`, `cost_events` — no separate calls needed on initial load.

### 6b. Edit asset (inline edit panels)
```ts
// PATCH /api/assets/{id}
// Body: any subset of AssetUpdate fields (only send what changed)
await api.patch(`/api/assets/${id}`, { status: newStatus });
```

### 6c. Photo upload
```ts
// POST /api/assets/{id}/photo
// Body: multipart/form-data with field "file"
const formData = new FormData();
formData.append('file', file);
const res = await api.post(`/api/assets/${id}/photo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
setAsset(res.data); // response is full updated AssetResponse
```

### 6d. Condition log tab
```ts
// POST /api/assets/{id}/condition-log
// Body: { date: string, rating: "Good"|"Fair"|"Poor"|"Critical", note?: string }
const res = await api.post(`/api/assets/${id}/condition-log`, { date, rating, note });
```

### 6e. Units tab
```ts
// POST /api/assets/{id}/units
// Body: { name, status, tenant_name?, monthly_rent? }
await api.post(`/api/assets/${id}/units`, { name, status, tenant_name, monthly_rent });

// PATCH /api/assets/{id}/units/{unit_id}
await api.patch(`/api/assets/${id}/units/${unitId}`, { status: newStatus });
```

### 6f. Equipment tab
```ts
// POST /api/assets/{id}/equipment
// Body: { name, condition, install_date?, last_service_date?, next_service_due? }
await api.post(`/api/assets/${id}/equipment`, { ... });

// PATCH /api/assets/{id}/equipment/{eq_id}
await api.patch(`/api/assets/${id}/equipment/${eqId}`, { condition: newCondition });
```

### 6g. Documents tab
```ts
// POST /api/assets/{id}/documents
// Body: multipart/form-data with field "file"
// Response: AssetDocumentResponse { id, name, size, uploaded_at, blob_url }
const formData = new FormData();
formData.append('file', file);
const res = await api.post(`/api/assets/${id}/documents`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```
Note: the API returns `uploaded_at` (snake_case). The frontend type has `uploadDate` — update the `Document` interface in `types.ts` or map the field on receipt.

### 6h. Cost events tab
```ts
// POST /api/assets/{id}/costs
// Body: { date, category, description?, amount: string }
// Categories: "Property Tax" | "Maintenance and Repair" | "Renovation" |
//             "Insurance Premium" | "Other"
await api.post(`/api/assets/${id}/costs`, { date, category, description, amount });
```

### 6i. Delete asset
```ts
// DELETE /api/assets/{id}
await api.delete(`/api/assets/${id}`);
navigate('/dashboard');
```

**Field name changes in responses** (API snake_case → frontend camelCase mapping needed):

| API response field | Frontend `types.ts` field |
|---|---|
| `registry_number` | `registryNumber` |
| `lot_size` | `lotSize` |
| `lot_size_unit` | `lotSizeUnit` |
| `build_year` | `buildYear` |
| `external_ref_id` | `externalRefId` |
| `owner_name` | `ownerName` |
| `acquisition_date` | `acquisitionDate` |
| `purchase_price` | `purchasePrice` |
| `has_mortgage` | `hasMortgage` |
| `mortgage.monthly_payment` | `mortgage.monthlyPayment` |
| `has_rental` | `hasRental` |
| `rental.monthly_income` | `rental.monthlyIncome` |
| `rental.tenant_name` | `rental.tenantName` |
| `rental.lease_start` | `rental.leaseStart` |
| `rental.lease_end` | `rental.leaseEnd` |
| `photo_url` | `photoUrl` |
| `condition_log` | `conditionLog` |
| `cost_events` | `costEvents` |
| `asset_documents` / `documents` | `documents` |
| `uploaded_at` | `uploadDate` |
| `blob_url` | `blobUrl` |

**Recommendation:** Rather than updating every component individually, add a camelCase response transformer to the `api.ts` axios instance using a library like `humps` (`npm install humps`) to auto-convert all API responses from snake_case to camelCase. This eliminates the field mapping entirely.

```ts
import { camelizeKeys } from 'humps';

api.interceptors.response.use((res) => {
  res.data = camelizeKeys(res.data);
  return res;
});
```

---

## Step 7 — Cost Events Page (`CostEvents.tsx`)

**File:** `src/pages/CostEvents.tsx`

**Current state:** Reads cost events from all assets stored in `localStorage`.

**What to change:**
```ts
// GET /api/cost-events/
// Optional query params: asset_id, category, start_date, end_date
// Response: CostEventWithAsset[] — includes asset_name alongside each event
const res = await api.get('/api/cost-events/');
setCostEvents(res.data);
```

---

## Step 8 — Activity Feed (`ActivityFeed.tsx`)

**File:** `src/pages/ActivityFeed.tsx`

**Current state:** Uses `mockActivities` — a hardcoded array of 8 items.

**What to change:**
Replace the mock array with:
```ts
// GET /api/activity-feed/
// Query params: limit=50, offset=0, event_type? (filter)
// Response: ActivityLogResponse[] — requires admin role
// Fields: id, event_type, user_email, action, target, asset_id, status, created_at
const res = await api.get('/api/activity-feed/', { params: { limit: 50 } });
setActivities(res.data);
```

**Field name changes:**
- `user` → `user_email` (or `userEmail` with humps)
- `timestamp` → `created_at` (or `createdAt`)
- `type` → `event_type` (or `eventType`)

---

## Step 9 — Admin Dashboard (`AdminDashboard.tsx`)

**File:** `src/pages/AdminDashboard.tsx`

Uses dashboard stats + user management. Wire up:
```ts
// GET /api/dashboard/stats
// GET /api/activity-feed/?limit=10  (recent activity widget)
// GET /api/users/me  (current user info in nav/header)
```

---

## Step 10 — Layout / Nav (`Layout.tsx`)

**File:** `src/components/Layout.tsx`

**What to add:**
1. Logout button that clears `brims_token` and `brims_role` from `localStorage` and navigates to `/login`
2. Display current user name pulled from `GET /api/users/me` on mount
3. Conditionally show admin nav links when `brims_role === 'admin'`

```ts
// GET /api/users/me
// Response: { id, email, fullname, role }
const res = await api.get('/api/users/me');
setCurrentUser(res.data);
```

---

## Step 11 — Remove localStorage Dependency

Once all API calls are in place, remove all references to `brims_assets` in `localStorage`. Search for:
```
localStorage.getItem('brims_assets')
localStorage.setItem('brims_assets'
```
These appear in `UserDashboard.tsx` and `AssetDetail.tsx`. The `brims_token` and `brims_role` keys should remain — they are the auth mechanism.

---

## Suggested Build Order

Work through these in sequence to keep the app functional at each step:

1. `src/lib/api.ts` — axios client with auth interceptor
2. `Login.tsx` — real auth, token storage
3. `App.tsx` — protected routes
4. `UserDashboard.tsx` — asset list + dashboard stats
5. `AssetWizard.tsx` — create asset
6. `AssetDetail.tsx` — read + all sub-resource writes
7. `CostEvents.tsx` — global cost events
8. `ActivityFeed.tsx` — activity log
9. `Layout.tsx` — user info + logout
10. `AdminDashboard.tsx` — admin-only stats

---

## API Reference Summary

| Method | Endpoint | Used By |
|---|---|---|
| `POST` | `/api/auth/login` | `Login.tsx` |
| `GET` | `/api/users/me` | `Layout.tsx`, `AdminDashboard.tsx` |
| `GET` | `/api/assets/` | `UserDashboard.tsx` |
| `POST` | `/api/assets/` | `AssetWizard.tsx` |
| `GET` | `/api/assets/{id}` | `AssetDetail.tsx` |
| `PATCH` | `/api/assets/{id}` | `AssetDetail.tsx` |
| `DELETE` | `/api/assets/{id}` | `AssetDetail.tsx` |
| `POST` | `/api/assets/{id}/photo` | `AssetDetail.tsx` |
| `GET/POST` | `/api/assets/{id}/condition-log` | `AssetDetail.tsx` |
| `GET/POST` | `/api/assets/{id}/units` | `AssetDetail.tsx` |
| `PATCH` | `/api/assets/{id}/units/{unit_id}` | `AssetDetail.tsx` |
| `GET/POST` | `/api/assets/{id}/equipment` | `AssetDetail.tsx` |
| `PATCH` | `/api/assets/{id}/equipment/{eq_id}` | `AssetDetail.tsx` |
| `GET/POST` | `/api/assets/{id}/documents` | `AssetDetail.tsx` |
| `GET/POST` | `/api/assets/{id}/costs` | `AssetDetail.tsx` |
| `GET` | `/api/dashboard/stats` | `UserDashboard.tsx`, `AdminDashboard.tsx` |
| `GET` | `/api/cost-events/` | `CostEvents.tsx` |
| `GET` | `/api/activity-feed/` | `ActivityFeed.tsx`, `AdminDashboard.tsx` |
