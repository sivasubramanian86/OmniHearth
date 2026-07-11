# OmniHearth Local Server Manager
# Spins up backend FastAPI and frontend Next.js dev servers concurrently.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 Launching OmniHearth Households OS..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start Backend FastAPI Server
Write-Host "Starting FastAPI Event Router on Port 8000..." -ForegroundColor Yellow
$backendPath = Join-Path $root "backend"
$pythonExe = Join-Path $backendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "ERROR: Python virtual environment not found in $backendPath" -ForegroundColor Red
    Write-Host "Please run backend setup: python -m venv .venv && pip install -r requirements.txt" -ForegroundColor Red
    Exit 1
}

Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendPath -NoNewWindow -PassThru

# 2. Start Frontend Next.js Server
Write-Host "Starting Next.js Development Server on Port 3000..." -ForegroundColor Yellow
$frontendPath = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "ERROR: Node modules not found in $frontendPath" -ForegroundColor Red
    Write-Host "Please run frontend setup: npm install" -ForegroundColor Red
    Exit 1
}

Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $frontendPath -NoNewWindow -PassThru

# 3. Wait for servers to spin up
Write-Host "Waiting for servers to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 3

# 4. Open default browser
Write-Host "Opening http://localhost:3000 in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "OmniHearth is ready! Press CTRL+C in this console or kill background processes to exit." -ForegroundColor Green
