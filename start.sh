#!/usr/bin/env bash
# =============================================================================
#  BRIMS — Start Script (macOS / Linux)
#  Starts the FastAPI backend and React frontend together.
#  Usage: ./start.sh
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
DIM='\033[2m'

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/BACKEND"
FRONTEND_DIR="$SCRIPT_DIR/FRONTEND_MIGRATION"
LOG_DIR="$SCRIPT_DIR/.logs"

BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PORT=8000
FRONTEND_PORT=3000

mkdir -p "$LOG_DIR"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${BOLD}${CYAN}[BRIMS]${RESET} $*"; }
success() { echo -e "${BOLD}${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${BOLD}${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${BOLD}${RED}  ✗${RESET} $*"; }
divider() { echo -e "${DIM}──────────────────────────────────────────────────${RESET}"; }

# ── Port check ────────────────────────────────────────────────────────────────
port_in_use() {
  lsof -ti:"$1" &>/dev/null
}

kill_port() {
  local port=$1
  if port_in_use "$port"; then
    warn "Port $port is already in use. Killing existing process..."
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# ── Cleanup on exit ───────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  log "Shutting down..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && success "Backend stopped"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && success "Frontend stopped"
  echo ""
  log "Goodbye."
  exit 0
}

trap cleanup SIGINT SIGTERM

# ── Banner ────────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ██████╗ ██████╗ ██╗███╗   ███╗███████╗"
echo "  ██╔══██╗██╔══██╗██║████╗ ████║██╔════╝"
echo "  ██████╔╝██████╔╝██║██╔████╔██║███████╗"
echo "  ██╔══██╗██╔══██╗██║██║╚██╔╝██║╚════██║"
echo "  ██████╔╝██║  ██║██║██║ ╚═╝ ██║███████║"
echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝"
echo -e "${RESET}"
echo -e "  ${DIM}Bold Realty Investment and Management Services${RESET}"
echo ""
divider

# ── 1. Check PostgreSQL ───────────────────────────────────────────────────────
log "Checking PostgreSQL..."

if pg_isready -q 2>/dev/null; then
  success "PostgreSQL is running"
else
  warn "PostgreSQL is not running. Attempting to start..."
  # Try Homebrew service first, then pg_ctl
  if command -v brew &>/dev/null; then
    brew services start postgresql@18 &>/dev/null || \
    brew services start postgresql@16 &>/dev/null || \
    brew services start postgresql    &>/dev/null || true
    sleep 2
  fi
  if pg_isready -q 2>/dev/null; then
    success "PostgreSQL started"
  else
    error "Could not start PostgreSQL. Please start it manually and re-run this script."
    exit 1
  fi
fi

# ── 2. Verify .env exists ─────────────────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
  error ".env file not found at BACKEND/.env"
  echo -e "  ${DIM}See SETUP.md for instructions on creating it.${RESET}"
  exit 1
fi
success ".env file found"

# ── 3. Resolve Python / uvicorn ───────────────────────────────────────────────
log "Resolving Python environment..."

# Use an array so multi-word commands (e.g. conda run -n base uvicorn) split correctly
UVICORN_CMD=()

# Priority: local venv → conda → system PATH
if [ -f "$BACKEND_DIR/venv/bin/uvicorn" ]; then
  UVICORN_CMD=("$BACKEND_DIR/venv/bin/uvicorn")
  PYTHON_CMD=("$BACKEND_DIR/venv/bin/python")
  success "Using local venv"
elif command -v conda &>/dev/null && conda run -n base uvicorn --version &>/dev/null 2>&1; then
  UVICORN_CMD=("conda" "run" "-n" "base" "uvicorn")
  PYTHON_CMD=("conda" "run" "-n" "base" "python")
  success "Using conda base environment"
elif command -v uvicorn &>/dev/null; then
  UVICORN_CMD=("uvicorn")
  PYTHON_CMD=("python3")
  success "Using system uvicorn"
else
  error "uvicorn not found. Install it with: pip install uvicorn"
  exit 1
fi

# ── 4. Check Node / npm ───────────────────────────────────────────────────────
log "Checking Node.js..."

if ! command -v npm &>/dev/null; then
  error "npm not found. Please install Node.js from https://nodejs.org/"
  exit 1
fi
success "Node.js $(node --version) / npm $(npm --version)"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  warn "node_modules not found. Running npm install..."
  cd "$FRONTEND_DIR" && npm install --silent
  success "Dependencies installed"
fi

# ── 5. Seed demo users ────────────────────────────────────────────────────────
divider
log "Seeding demo accounts..."

(
  set +e
  cd "$BACKEND_DIR"
  "${PYTHON_CMD[@]}" - << 'PYEOF'
import sys
sys.path.insert(0, '.')
from app.core.security import get_password_hash
from app.database.database import engine
from app.models.user import Users, UserRole
from sqlmodel import Session, select

with Session(engine) as db:
    existing = [u.email for u in db.exec(select(Users)).all()]
    to_create = [
        Users(email='admin@brims.com', password=get_password_hash('Admin@1234'), fullname='BRIMS Admin', role=UserRole.ADMIN),
        Users(email='user@brims.com',  password=get_password_hash('User@1234'),  fullname='BRIMS User',  role=UserRole.USER),
    ]
    created = []
    for u in to_create:
        if u.email not in existing:
            db.add(u)
            created.append(u.email)
    db.commit()
    if created:
        print(f"  Created: {', '.join(created)}")
    else:
        print("  Demo accounts already exist — no changes made")
PYEOF
) 2>/dev/null
success "Demo accounts ready"

# ── 7. Free ports if needed ───────────────────────────────────────────────────
divider
log "Checking ports..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
success "Ports $BACKEND_PORT and $FRONTEND_PORT are free"

# ── 6. Start backend ──────────────────────────────────────────────────────────
divider
log "Starting backend on port $BACKEND_PORT..."

> "$BACKEND_LOG"

# Disable set -e inside the subshell so uvicorn's exit code doesn't kill it prematurely
(
  set +e
  cd "$BACKEND_DIR"
  "${UVICORN_CMD[@]}" main:app \
    --host 0.0.0.0 \
    --port $BACKEND_PORT \
    --reload \
    >> "$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

# Wait for backend to be ready — check HTTP response code (any non-000 means server is up)
TRIES=0
until [ "$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/" 2>/dev/null)" != "000" ] || \
      grep -q "Application startup complete" "$BACKEND_LOG" 2>/dev/null; do
  sleep 1
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge 20 ]; then
    error "Backend failed to start. Check logs: $BACKEND_LOG"
    cat "$BACKEND_LOG"
    cleanup
    exit 1
  fi
done

success "Backend running  →  http://localhost:$BACKEND_PORT"
echo -e "         ${DIM}API docs →  http://localhost:$BACKEND_PORT/docs${RESET}"

# ── 7. Start frontend ─────────────────────────────────────────────────────────
divider
log "Starting frontend on port $FRONTEND_PORT..."

> "$FRONTEND_LOG"

(
  cd "$FRONTEND_DIR"
  npm run dev >> "$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!

# Wait for frontend to be ready (up to 20 seconds)
TRIES=0
until grep -q "Local:" "$FRONTEND_LOG" 2>/dev/null; do
  sleep 1
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge 20 ]; then
    error "Frontend failed to start. Check logs: $FRONTEND_LOG"
    cat "$FRONTEND_LOG"
    cleanup
    exit 1
  fi
done

success "Frontend running  →  http://localhost:$FRONTEND_PORT"

# ── 8. Open browser ───────────────────────────────────────────────────────────
sleep 1
if command -v open &>/dev/null; then
  open "http://localhost:$FRONTEND_PORT"
fi

# ── 11. Summary ───────────────────────────────────────────────────────────────
divider
echo ""
echo -e "  ${BOLD}${GREEN}BRIMS is running!${RESET}"
echo ""
echo -e "  ${BOLD}Frontend${RESET}   http://localhost:$FRONTEND_PORT"
echo -e "  ${BOLD}Backend${RESET}    http://localhost:$BACKEND_PORT"
echo -e "  ${BOLD}API Docs${RESET}   http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "  ${BOLD}Test Credentials${RESET}"
echo -e "  ${DIM}Admin  →  admin@brims.com  /  Admin@1234${RESET}"
echo -e "  ${DIM}User   →  user@brims.com   /  User@1234${RESET}"
echo ""
echo -e "  ${DIM}Logs → .logs/backend.log  |  .logs/frontend.log${RESET}"
echo ""
divider
echo -e "  ${BOLD}${YELLOW}Press Ctrl+C to stop all servers${RESET}"
divider
echo ""

# ── 11. Tail logs ─────────────────────────────────────────────────────────────
tail -f "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!

wait $BACKEND_PID $FRONTEND_PID
