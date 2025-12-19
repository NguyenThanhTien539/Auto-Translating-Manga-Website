# Manga Translation API - Auto Setup Script
# Tự động tạo UV environment và cài đặt dependencies

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Manga Translation API - Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if UV is installed
Write-Host "[1/6] Checking UV installation..." -ForegroundColor Yellow
$uvInstalled = Get-Command uv -ErrorAction SilentlyContinue

if (-not $uvInstalled) {
    Write-Host "UV not found. Installing UV package manager..." -ForegroundColor Yellow
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "[OK] UV installed successfully" -ForegroundColor Green
} else {
    Write-Host "[OK] UV already installed" -ForegroundColor Green
}

# Create virtual environment
Write-Host ""
Write-Host "[2/6] Creating virtual environment with Python 3.12..." -ForegroundColor Yellow

if (Test-Path ".venv") {
    Write-Host "Virtual environment already exists. Skipping..." -ForegroundColor Gray
} else {
    uv venv --python 3.12
    Write-Host "[OK] Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "[3/6] Installing core dependencies..." -ForegroundColor Yellow
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
uv pip install -r requirements-server.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Core dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Install VietOCR
Write-Host ""
Write-Host ""
Write-Host "[4/6] Installing VietOCR for Vietnamese..." -ForegroundColor Yellow
uv pip install vietocr

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] VietOCR installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] VietOCR installation failed (optional)" -ForegroundColor Yellow
}

# Setup .env file
Write-Host ""
Write-Host "[5/6] Setting up configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host ".env file already exists. Skipping..." -ForegroundColor Gray
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] .env file created from template" -ForegroundColor Green
    Write-Host "  -> Edit .env to add your API keys if needed" -ForegroundColor Gray
}

# Verify installation
Write-Host ""
Write-Host "[6/6] Verifying installation..." -ForegroundColor Yellow

$pythonVersion = & .\.venv\Scripts\python.exe --version
Write-Host "  Python: $pythonVersion" -ForegroundColor Gray

$fastapiInstalled = & .\.venv\Scripts\python.exe -c "import fastapi; print('OK')" 2>$null
if ($fastapiInstalled -eq "OK") {
    Write-Host "  FastAPI: [OK] Installed" -ForegroundColor Gray
}

$pillowInstalled = & .\.venv\Scripts\python.exe -c "import PIL; print('OK')" 2>$null
if ($pillowInstalled -eq "OK") {
    Write-Host "  Pillow: [OK] Installed" -ForegroundColor Gray
}

$vietocrInstalled = & .\.venv\Scripts\python.exe -c "import vietocr; print('OK')" 2>$null
if ($vietocrInstalled -eq "OK") {
    Write-Host "  VietOCR: [OK] Installed" -ForegroundColor Gray
} else {
    Write-Host "  VietOCR: [SKIP] Not installed (optional)" -ForegroundColor Yellow
}

# Done
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "[SUCCESS] Setup completed!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Activate virtual environment:" -ForegroundColor White
Write-Host "     .\.venv\Scripts\activate" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. (Optional) Edit .env file to add API keys:" -ForegroundColor White
Write-Host "     notepad .env" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start the server:" -ForegroundColor White
Write-Host "     cd fast-api" -ForegroundColor Gray
Write-Host "     python run_server.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Open API docs:" -ForegroundColor White
Write-Host "     http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
