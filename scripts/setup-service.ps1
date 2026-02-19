# mail-to-notion Windows Service Setup Script
# Run in Administrator PowerShell: powershell -ExecutionPolicy Bypass -File scripts/setup-service.ps1

$ErrorActionPreference = "Stop"

function Write-Step($step, $msg) {
    Write-Host "`n[$step] $msg" -ForegroundColor Cyan
}

# Check administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Administrator privileges required. Run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

# Navigate to project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot
Write-Host "Project path: $projectRoot"

# 1. Check pm2 global installation
Write-Step 1 "Checking pm2 global installation"
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
    Write-Host "  pm2 not found. Installing..."
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pm2 installation failed" -ForegroundColor Red; exit 1 }
    Write-Host "  pm2 installed successfully" -ForegroundColor Green
} else {
    Write-Host "  pm2 already installed: $($pm2.Source)" -ForegroundColor Green
}

# 2. Start apps with pm2
Write-Step 2 "pm2 start ecosystem.config.cjs"
pm2 start ecosystem.config.cjs
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pm2 start failed" -ForegroundColor Red; exit 1 }
Write-Host "  Apps started successfully" -ForegroundColor Green

# 3. Install pm2-windows-startup
Write-Step 3 "Installing pm2-windows-startup"
$pmStartup = Get-Command pm2-startup -ErrorAction SilentlyContinue
if (-not $pmStartup) {
    Write-Host "  Installing pm2-windows-startup..."
    npm install -g pm2-windows-startup
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pm2-windows-startup installation failed" -ForegroundColor Red; exit 1 }
    Write-Host "  Installed successfully" -ForegroundColor Green
} else {
    Write-Host "  pm2-windows-startup already installed" -ForegroundColor Green
}

# 4. Register Windows service
Write-Step 4 "pm2-startup install (Register Windows service)"
pm2-startup install
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: pm2-startup install failed. It may already be registered." -ForegroundColor Yellow
} else {
    Write-Host "  Service registered successfully" -ForegroundColor Green
}

# 5. Save pm2 process list
Write-Step 5 "pm2 save (Save process list)"
pm2 save
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pm2 save failed" -ForegroundColor Red; exit 1 }
Write-Host "  Saved successfully" -ForegroundColor Green

# Done
Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Windows Service Setup Complete!" -ForegroundColor Green
Write-Host " - mail-to-notion: Backend server" -ForegroundColor White
Write-Host " - mail-to-notion-watchdog: Health check watchdog" -ForegroundColor White
Write-Host " - Auto-start on Windows boot enabled" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nCheck status: pm2 status"
Write-Host "View logs: pm2 logs"
Write-Host "Watchdog log: type logs\watchdog.log"
