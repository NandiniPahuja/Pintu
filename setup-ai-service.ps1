# PixMorph AI Service Setup Script
# Run this script to set up the AI service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PixMorph AI Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green

# Navigate to ai-services directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiServicesPath = Join-Path $scriptPath "ai-services"

if (-not (Test-Path $aiServicesPath)) {
    Write-Host "ERROR: ai-services directory not found at $aiServicesPath" -ForegroundColor Red
    exit 1
}

Set-Location $aiServicesPath
Write-Host "✓ Working directory: $aiServicesPath" -ForegroundColor Green

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists, skipping..." -ForegroundColor Yellow
} else {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
Write-Host "✓ Virtual environment activated" -ForegroundColor Green

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
Write-Host "✓ Pip upgraded" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 10-15 minutes on first run..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Create directories
Write-Host ""
Write-Host "Creating required directories..." -ForegroundColor Yellow
if (-not (Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" | Out-Null
    Write-Host "✓ Created models directory" -ForegroundColor Green
}
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "✓ Created uploads directory" -ForegroundColor Green
}

# Copy environment file
Write-Host ""
Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file (please configure if needed)" -ForegroundColor Green
} else {
    Write-Host ".env already exists, skipping..." -ForegroundColor Yellow
}

# Check GPU availability
Write-Host ""
Write-Host "Checking GPU availability..." -ForegroundColor Yellow
$gpuCheck = python -c "import torch; print('CUDA available:', torch.cuda.is_available())" 2>&1
Write-Host $gpuCheck -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and configure .env file if needed" -ForegroundColor White
Write-Host "2. Run: python app.py" -ForegroundColor White
Write-Host "3. The service will download models on first run (~4GB)" -ForegroundColor White
Write-Host "4. Service will be available at http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "To start the service now, run:" -ForegroundColor Yellow
Write-Host "  python app.py" -ForegroundColor Cyan
Write-Host ""
