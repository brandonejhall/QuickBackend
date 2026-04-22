# =============================================================================
#  BRIMS — Start Script (Windows PowerShell)
#  Starts the FastAPI backend and React frontend in separate windows.
#  Usage: Right-click → "Run with PowerShell"  OR  .\start.ps1
# =============================================================================

#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Paths ─────────────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ScriptDir "BACKEND"
$FrontendDir = Join-Path $ScriptDir "FRONTEND_MIGRATION"
$LogDir      = Join-Path $ScriptDir ".logs"
$BackendLog  = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"

$BackendPort  = 8000
$FrontendPort = 3000

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ██████╗ ██████╗ ██╗███╗   ███╗███████╗" -ForegroundColor Cyan
    Write-Host "  ██╔══██╗██╔══██╗██║████╗ ████║██╔════╝" -ForegroundColor Cyan
    Write-Host "  ██████╔╝██████╔╝██║██╔████╔██║███████╗" -ForegroundColor Cyan
    Write-Host "  ██╔══██╗██╔══██╗██║██║╚██╔╝██║╚════██║" -ForegroundColor Cyan
    Write-Host "  ██████╔╝██║  ██║██║██║ ╚═╝ ██║███████║" -ForegroundColor Cyan
    Write-Host "  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Bold Realty Investment and Management Services" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host ("─" * 52) -ForegroundColor DarkGray
}

function Write-Step  ($msg) { Write-Host "[BRIMS] $msg" -ForegroundColor Cyan }
function Write-Ok    ($msg) { Write-Host "  ✓  $msg" -ForegroundColor Green }
function Write-Warn  ($msg) { Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Write-Fail  ($msg) { Write-Host "  ✗  $msg" -ForegroundColor Red }
function Write-Div         { Write-Host ("─" * 52) -ForegroundColor DarkGray }

function Test-Port ($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Stop-Port ($port) {
    if (Test-Port $port) {
        Write-Warn "Port $port in use. Killing process..."
        $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }
}

function Find-UvicornCmd {
    # Priority: local venv → conda → system PATH
    $venvUvicorn = Join-Path $BackendDir "venv\Scripts\uvicorn.exe"
    if (Test-Path $venvUvicorn) {
        return $venvUvicorn
    }
    $condaUvicorn = & conda run -n base where uvicorn 2>$null
    if ($LASTEXITCODE -eq 0 -and $condaUvicorn) {
        return "conda run -n base uvicorn"
    }
    $sysUvicorn = Get-Command uvicorn -ErrorAction SilentlyContinue
    if ($sysUvicorn) {
        return "uvicorn"
    }
    return $null
}

function Find-PythonCmd {
    $venvPython = Join-Path $BackendDir "venv\Scripts\python.exe"
    if (Test-Path $venvPython) { return $venvPython }
    $condaPy = & conda run -n base where python 2>$null
    if ($LASTEXITCODE -eq 0 -and $condaPy) { return "conda run -n base python" }
    $sysPy = Get-Command python -ErrorAction SilentlyContinue
    if ($sysPy) { return "python" }
    return $null
}

function Invoke-SeedUsers ($pythonCmd) {
    $seedScript = @'
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
        print("  Demo accounts already exist - no changes made")
'@
    $tmpFile = [System.IO.Path]::GetTempFileName() + ".py"
    $seedScript | Out-File -FilePath $tmpFile -Encoding utf8

    Push-Location $BackendDir
    if ($pythonCmd -like "conda*") {
        & conda run -n base python $tmpFile 2>$null
    } else {
        & $pythonCmd $tmpFile 2>$null
    }
    Pop-Location
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
}

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Header

# ── 1. Check .env ─────────────────────────────────────────────────────────────
Write-Step "Checking environment..."
$envFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Fail ".env not found at BACKEND\.env — see SETUP.md"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Ok ".env file found"

# ── 2. Check PostgreSQL ───────────────────────────────────────────────────────
Write-Step "Checking PostgreSQL..."
$pgReady = & pg_isready 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "PostgreSQL not responding. Attempting to start service..."
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        Start-Service $pgService.Name -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        $pgReady = & pg_isready 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Could not start PostgreSQL. Start it manually and re-run."
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Ok "PostgreSQL service started"
    } else {
        Write-Fail "PostgreSQL service not found. Make sure it is installed and running."
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Ok "PostgreSQL is running"
}

# ── 3. Resolve uvicorn + Python ───────────────────────────────────────────────
Write-Step "Resolving Python environment..."
$uvicornCmd = Find-UvicornCmd
if (-not $uvicornCmd) {
    Write-Fail "uvicorn not found. Run: pip install uvicorn"
    Read-Host "Press Enter to exit"
    exit 1
}
$pythonCmd = Find-PythonCmd
Write-Ok "Found uvicorn + Python"

# ── 4. Check Node ─────────────────────────────────────────────────────────────
Write-Step "Checking Node.js..."
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Fail "npm not found. Install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}
$nodeVer = & node --version
$npmVer  = & npm --version
Write-Ok "Node $nodeVer / npm $npmVer"

$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Warn "node_modules missing. Running npm install..."
    Push-Location $FrontendDir
    & npm install --silent
    Pop-Location
    Write-Ok "Dependencies installed"
}

# ── 5. Seed demo users ────────────────────────────────────────────────────────
Write-Div
Write-Step "Seeding demo accounts..."
if ($pythonCmd) {
    Invoke-SeedUsers $pythonCmd
    Write-Ok "Demo accounts ready"
} else {
    Write-Warn "Python not found — skipping demo account creation"
}

# ── 6. Free ports ─────────────────────────────────────────────────────────────
Write-Div
Write-Step "Checking ports..."
Stop-Port $BackendPort
Stop-Port $FrontendPort
Write-Ok "Ports $BackendPort and $FrontendPort are free"

# ── 6. Start backend in new window ────────────────────────────────────────────
Write-Div
Write-Step "Starting backend (port $BackendPort)..."

$backendScript = @"
`$Host.UI.RawUI.WindowTitle = 'BRIMS Backend — :$BackendPort'
Write-Host 'BRIMS Backend starting...' -ForegroundColor Cyan
Set-Location '$BackendDir'
$uvicornCmd main:app --host 0.0.0.0 --port $BackendPort --reload
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Poll until backend responds (up to 20 seconds)
$tries = 0
do {
    Start-Sleep -Seconds 1
    $tries++
    try {
        $r = Invoke-WebRequest "http://localhost:$BackendPort/" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        break
    } catch {
        # Still starting
    }
} while ($tries -lt 20)

if ($tries -ge 20) {
    Write-Fail "Backend did not start in time. Check the backend window for errors."
} else {
    Write-Ok "Backend running  →  http://localhost:$BackendPort"
    Write-Host "         API Docs →  http://localhost:$($BackendPort)/docs" -ForegroundColor DarkGray
}

# ── 7. Start frontend in new window ───────────────────────────────────────────
Write-Div
Write-Step "Starting frontend (port $FrontendPort)..."

$frontendScript = @"
`$Host.UI.RawUI.WindowTitle = 'BRIMS Frontend — :$FrontendPort'
Write-Host 'BRIMS Frontend starting...' -ForegroundColor Cyan
Set-Location '$FrontendDir'
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Poll until frontend responds (up to 25 seconds)
$tries = 0
do {
    Start-Sleep -Seconds 1
    $tries++
    try {
        $r = Invoke-WebRequest "http://localhost:$FrontendPort/" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        break
    } catch {
        # Still starting
    }
} while ($tries -lt 25)

if ($tries -ge 25) {
    Write-Warn "Frontend may still be starting. Check the frontend window."
} else {
    Write-Ok "Frontend running  →  http://localhost:$FrontendPort"
}

# ── 8. Open browser ───────────────────────────────────────────────────────────
Start-Sleep -Seconds 1
Start-Process "http://localhost:$FrontendPort"

# ── 9. Summary ────────────────────────────────────────────────────────────────
Write-Div
Write-Host ""
Write-Host "  BRIMS is running!" -ForegroundColor Green -NoNewline
Write-Host "  (each server runs in its own window)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Frontend   " -NoNewline; Write-Host "http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "  Backend    " -NoNewline; Write-Host "http://localhost:$BackendPort"  -ForegroundColor Cyan
Write-Host "  API Docs   " -NoNewline; Write-Host "http://localhost:$BackendPort/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test Credentials" -ForegroundColor White
Write-Host "  Admin  →  admin@brims.com  /  Admin@1234" -ForegroundColor DarkGray
Write-Host "  User   →  user@brims.com   /  User@1234"  -ForegroundColor DarkGray
Write-Host ""
Write-Div
Write-Host ""
Write-Host "  Close the backend and frontend windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this launcher"
