# Quick run script - Activate venv and start server
# Usage: .\run.ps1

if (-not (Test-Path ".venv")) {
    Write-Host "Virtual environment not found. Please run setup.ps1 first." -ForegroundColor Red
    Write-Host ".\setup.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Manga Translation API Server..." -ForegroundColor Cyan

# Activate and run
& .\.venv\Scripts\python.exe fast-api\run_server.py
