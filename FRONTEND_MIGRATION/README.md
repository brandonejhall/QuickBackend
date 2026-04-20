# BRIMS - Bold Realty Investment and Management Services

BRIMS is a full-featured Asset Management System designed for managing real estate and commercial assets. This frontend provides a robust interface for asset tracking, financial monitoring, and document management.

## 🚀 Tech Stack

- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Animations:** Framer Motion (motion/react)
- **Data Handling:** TypeScript
- **Persistence:** Current implementation uses `localStorage` (`brims_assets` key)

## 📁 Project Structure

```text
src/
├── components/       # Reusable UI components and Layout wrapper
├── pages/            # Page-level components (Dashboard, Wizard, Detail, etc.)
├── types.ts          # Central TypeScript interfaces and enums
└── main.tsx          # Application entry point
```

## 🛠 Features

- **Multi-step Asset Wizard:** 3-step property creation with validation.
- **Dynamic Dashboard:** Real-time KPI calculations and asset portfolio overview.
- **Deep Asset Detail:** Comprehensive dashboard for individual assets including:
  - Financial tracking (Valuation, Mortgage, Rental)
  - Condition logging with ratings
  - Unit/Sub-asset management
  - Equipment maintenance tracking
  - Document management
- **Portfolio Reports:** Print-optimized summaries and detailed registers.
- **Activity Feed:** System-wide audit log for administrative oversight.
- **Cost Events:** Centralized tracking of all property-related expenses.

---

## 📡 API Requirements (For Backend Integration)

To migrate this frontend to a full-stack architecture, the following endpoints are required.

### 1. Authentication
- `POST /api/auth/login`: Authenticate user.
- `POST /api/auth/logout`: Invalidate session.
- `GET /api/users/me`: Current user profile and permissions.

### 2. Assets
- `GET /api/assets`: List all assets.
- `GET /api/assets/{id}`: Detailed asset data (Matches `Asset` interface in `types.ts`).
- `POST /api/assets`: Create a new asset.
- `PATCH /api/assets/{id}`: Partially update asset details.
- `DELETE /api/assets/{id}`: Remove an asset.
- `POST /api/assets/{id}/photo`: Image upload (Base64 or Multipart).

### 3. Sub-Resources (Asset Detail Tabs)
- `GET/POST /api/assets/{id}/condition-log`: Condition history entries.
- `GET/POST/PATCH /api/assets/{id}/units`: Unit/Occupancy management.
- `GET/POST/PATCH /api/assets/{id}/equipment`: Physical equipment maintenance.
- `GET/POST /api/assets/{id}/documents`: Document metadata and upload (Google Drive Proxy).
- `GET/POST /api/assets/{id}/costs`: Asset-specific financial events.

### 4. Global Data
- `GET /api/dashboard/stats`: KPI summaries for the main dashboard.
- `GET /api/cost-events`: Global list of all portfolio expenses.
- `GET /api/activity-feed`: System audit logs for Admin visibility.

---

## 💻 Development

### Prerequisites
- Node.js (Latest LTS)
- npm or yarn

### Installation
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The application runs on port 3000 by default.

## 📝 Demo Data
The application currently boots with a seeded demo asset (**Ocean View Villa**) for presentation purposes if `localStorage` is empty. You can find the seeding logic in `src/pages/AssetDetail.tsx` and `src/pages/UserDashboard.tsx`.
