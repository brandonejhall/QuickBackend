# BRIMS — Setup Guide

**Bold Realty Investment and Management Services**  
Full-stack asset management platform — FastAPI backend + React 19 frontend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [macOS Setup](#macos-setup)
4. [Windows Setup](#windows-setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Initialisation](#database-initialisation)
7. [Creating Test Users](#creating-test-users)
8. [Running the Application](#running-the-application)
9. [Default Credentials](#default-credentials)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build tool |
| PostgreSQL | 14+ | Database |
| Git | Any | Version control |

---

## Project Structure

```
QuickBackend/
├── BACKEND/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLModel table definitions
│   │   ├── schemas/  # Pydantic request/response models
│   │   ├── core/     # Auth, security helpers
│   │   └── database/ # DB engine and session
│   ├── alembic/      # Migration history
│   ├── main.py       # Application entry point
│   ├── requirements.txt
│   └── .env          # Environment variables (create this)
└── FRONTEND_MIGRATION/  # React 19 + Vite application
    ├── src/
    │   ├── pages/    # Route-level page components
    │   ├── components/
    │   └── lib/api.ts  # Axios API client
    └── package.json
```

---

## macOS Setup

### 1. Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install System Dependencies

```bash
brew install python@3.13 node postgresql@18
```

Start and enable PostgreSQL:

```bash
brew services start postgresql@18
```

Verify installations:

```bash
python3 --version   # Python 3.13.x
node --version      # v18+
psql --version      # psql (PostgreSQL) 18.x
```

### 3. Clone the Repository

```bash
git clone <repository-url> QuickBackend
cd QuickBackend
```

### 4. Backend Setup

```bash
cd BACKEND

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 5. Frontend Setup

```bash
cd ../FRONTEND_MIGRATION

# Install Node dependencies
npm install
```

---

## Windows Setup

### 1. Install System Dependencies

**Python** — Download from [python.org](https://www.python.org/downloads/)  
During installation, check **"Add Python to PATH"**.

**Node.js** — Download from [nodejs.org](https://nodejs.org/)  
Use the LTS version. npm is bundled with it.

**PostgreSQL** — Download from [postgresql.org](https://www.postgresql.org/download/windows/)  
Run the installer. Note the password you set for the `postgres` superuser.

Verify in a new terminal (Command Prompt or PowerShell):

```powershell
python --version   # Python 3.13.x
node --version     # v18+
psql --version     # psql (PostgreSQL) 18.x
```

### 2. Clone the Repository

```powershell
git clone <repository-url> QuickBackend
cd QuickBackend
```

### 3. Backend Setup

```powershell
cd BACKEND

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

> If you see a `psycopg2` error on Windows, install the binary version instead:
> ```powershell
> pip install psycopg2-binary
> ```

### 4. Frontend Setup

```powershell
cd ..\FRONTEND_MIGRATION

# Install Node dependencies
npm install
```

---

## Environment Configuration

Create a `.env` file inside the `BACKEND/` directory.

### macOS

```bash
cd BACKEND
cat > .env << 'EOF'
DATABASE_URL=postgresql://brandonhall@localhost:5432/brims
SECRET_KEY=changeme-use-a-strong-random-secret-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CREDENTIALS_FILE=./credentials.json
ALLOWED_ORIGINS=http://localhost:3000
SHARE_EMAIL=
EOF
```

### Windows (PowerShell)

```powershell
cd BACKEND
@"
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/brims
SECRET_KEY=changeme-use-a-strong-random-secret-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CREDENTIALS_FILE=./credentials.json
ALLOWED_ORIGINS=http://localhost:3000
SHARE_EMAIL=
"@ | Out-File -FilePath .env -Encoding utf8
```

> **Important:** Replace `yourpassword` with the password you set during PostgreSQL installation on Windows. On macOS with Homebrew, the default is a passwordless local connection — use your macOS username as the DB user.

---

## Database Initialisation

### 1. Create the Database

**macOS:**

```bash
psql postgres -c "CREATE DATABASE brims;"
```

**Windows (PowerShell — run as the postgres user):**

```powershell
psql -U postgres -c "CREATE DATABASE brims;"
```

### 2. Create Tables

From the `BACKEND/` directory with the virtual environment active:

**macOS:**

```bash
cd BACKEND
source venv/bin/activate
python3 -c "
from sqlmodel import SQLModel
from app.database.database import engine
from app.models import *
SQLModel.metadata.create_all(engine)
print('All tables created successfully.')
"
```

**Windows:**

```powershell
cd BACKEND
venv\Scripts\activate
python -c "
from sqlmodel import SQLModel
from app.database.database import engine
from app.models import *
SQLModel.metadata.create_all(engine)
print('All tables created successfully.')
"
```

### 3. Stamp Alembic

Mark the database as up-to-date with the migration history so Alembic doesn't try to re-apply migrations:

**macOS / Windows:**

```bash
alembic stamp head
```

---

## Creating Test Users

Run this script from the `BACKEND/` directory with the virtual environment active. It creates one admin and one regular user, skipping any that already exist.

### macOS

```bash
cd BACKEND
source venv/bin/activate

python3 -c "
import sys
sys.path.insert(0, '.')
from app.core.security import get_password_hash
from app.database.database import engine
from app.models.user import Users, UserRole
from sqlmodel import Session, select

with Session(engine) as db:
    existing_emails = [u.email for u in db.exec(select(Users)).all()]

    users_to_create = [
        Users(
            email='admin@brims.com',
            password=get_password_hash('Admin@1234'),
            fullname='BRIMS Admin',
            role=UserRole.ADMIN
        ),
        Users(
            email='user@brims.com',
            password=get_password_hash('User@1234'),
            fullname='BRIMS User',
            role=UserRole.USER
        ),
    ]

    created = []
    for user in users_to_create:
        if user.email not in existing_emails:
            db.add(user)
            created.append(user.email)

    db.commit()

    if created:
        print('Created users:', created)
    else:
        print('Users already exist — no changes made.')

    print()
    print('Current users in database:')
    for u in db.exec(select(Users)).all():
        print(f'  [{u.role.value.upper():5}]  {u.email}  ({u.fullname})')
"
```

### Windows (PowerShell)

```powershell
cd BACKEND
venv\Scripts\activate

python -c "
import sys
sys.path.insert(0, '.')
from app.core.security import get_password_hash
from app.database.database import engine
from app.models.user import Users, UserRole
from sqlmodel import Session, select

with Session(engine) as db:
    existing_emails = [u.email for u in db.exec(select(Users)).all()]

    users_to_create = [
        Users(
            email='admin@brims.com',
            password=get_password_hash('Admin@1234'),
            fullname='BRIMS Admin',
            role=UserRole.ADMIN
        ),
        Users(
            email='user@brims.com',
            password=get_password_hash('User@1234'),
            fullname='BRIMS User',
            role=UserRole.USER
        ),
    ]

    created = []
    for user in users_to_create:
        if user.email not in existing_emails:
            db.add(user)
            created.append(user.email)

    db.commit()

    if created:
        print('Created users:', created)
    else:
        print('Users already exist — no changes made.')

    print()
    print('Current users in database:')
    for u in db.exec(select(Users)).all():
        print(f'  [{u.role.value.upper():5}]  {u.email}  ({u.fullname})')
"
```

---

## Running the Application

Both servers must be running simultaneously. Open two terminal windows.

### Terminal 1 — Backend (FastAPI)

**macOS:**

```bash
cd BACKEND
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Windows:**

```powershell
cd BACKEND
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

---

### Terminal 2 — Frontend (React + Vite)

**macOS / Windows:**

```bash
cd FRONTEND_MIGRATION
npm run dev
```

The application will be available at `http://localhost:3000`.

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so there are no CORS issues during development.

---

## Default Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | `admin@brims.com` | `Admin@1234` | Full access — Dashboard, Assets, Cost Events, Activity Feed, Admin Dashboard |
| User | `user@brims.com` | `User@1234` | Standard access — Dashboard, Assets, Cost Events only |

> Admin-only routes: `/activity` (Activity Feed) and `/admin` (Admin Dashboard). These redirect non-admin users back to the dashboard automatically.

---

## Troubleshooting

### `psycopg2` fails to install (Windows)

```powershell
pip uninstall psycopg2
pip install psycopg2-binary
```

### `ModuleNotFoundError` when running backend scripts

Make sure the virtual environment is active before running any Python commands:

- macOS: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

### PostgreSQL connection refused

Check that PostgreSQL is running:

- macOS: `brew services list | grep postgresql`  
  Start: `brew services start postgresql@18`
- Windows: Open **Services** (`services.msc`) and ensure **postgresql-x64-18** is running.

### Port already in use

If port `8000` or `3000` is occupied, find and kill the process:

**macOS:**

```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**Windows (PowerShell):**

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F

netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### `alembic stamp head` fails

If Alembic reports a missing revision, the migration history may be stale. Skip Alembic entirely — the tables were already created via `SQLModel.metadata.create_all()`:

```bash
alembic stamp head --purge
```

### Frontend shows blank page or network errors

Confirm the backend is running on port `8000` before opening the frontend. Check the browser console for `401` or `Network Error` messages — these indicate the backend is not reachable or the `.env` is misconfigured.

### Google Drive integration not working

The `GOOGLE_CREDENTIALS_FILE` in `.env` must point to a valid Google service account credentials JSON file. Without it, document uploads will fail. Contact the project owner for the credentials file. All other features (assets, cost events, activity feed) work without Google Drive configured.
