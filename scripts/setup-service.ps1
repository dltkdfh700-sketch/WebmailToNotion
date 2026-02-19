# mail-to-notion Windows 서비스 등록 스크립트
# 관리자 권한 PowerShell에서 실행: powershell -ExecutionPolicy Bypass -File scripts/setup-service.ps1

$ErrorActionPreference = "Stop"

function Write-Step($step, $msg) {
    Write-Host "`n[$step] $msg" -ForegroundColor Cyan
}

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[오류] 관리자 권한이 필요합니다. PowerShell을 관리자로 실행하세요." -ForegroundColor Red
    exit 1
}

# 프로젝트 루트로 이동
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot
Write-Host "프로젝트 경로: $projectRoot"

# 1. pm2 전역 설치 확인
Write-Step 1 "pm2 전역 설치 확인"
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
    Write-Host "  pm2가 없습니다. 설치 중..."
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) { Write-Host "[오류] pm2 설치 실패" -ForegroundColor Red; exit 1 }
    Write-Host "  pm2 설치 완료" -ForegroundColor Green
} else {
    Write-Host "  pm2 이미 설치됨: $($pm2.Source)" -ForegroundColor Green
}

# 2. pm2로 앱 시작
Write-Step 2 "pm2 start ecosystem.config.cjs"
pm2 start ecosystem.config.cjs
if ($LASTEXITCODE -ne 0) { Write-Host "[오류] pm2 start 실패" -ForegroundColor Red; exit 1 }
Write-Host "  앱 시작 완료" -ForegroundColor Green

# 3. pm2-windows-startup 전역 설치
Write-Step 3 "pm2-windows-startup 전역 설치"
$pmStartup = Get-Command pm2-startup -ErrorAction SilentlyContinue
if (-not $pmStartup) {
    Write-Host "  pm2-windows-startup 설치 중..."
    npm install -g pm2-windows-startup
    if ($LASTEXITCODE -ne 0) { Write-Host "[오류] pm2-windows-startup 설치 실패" -ForegroundColor Red; exit 1 }
    Write-Host "  설치 완료" -ForegroundColor Green
} else {
    Write-Host "  pm2-windows-startup 이미 설치됨" -ForegroundColor Green
}

# 4. Windows 서비스 등록
Write-Step 4 "pm2-startup install (Windows 서비스 등록)"
pm2-startup install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[경고] pm2-startup install 실패. 이미 등록되어 있을 수 있습니다." -ForegroundColor Yellow
} else {
    Write-Host "  서비스 등록 완료" -ForegroundColor Green
}

# 5. pm2 save
Write-Step 5 "pm2 save (프로세스 목록 저장)"
pm2 save
if ($LASTEXITCODE -ne 0) { Write-Host "[오류] pm2 save 실패" -ForegroundColor Red; exit 1 }
Write-Host "  저장 완료" -ForegroundColor Green

# 완료
Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Windows 서비스 등록 완료!" -ForegroundColor Green
Write-Host " - mail-to-notion: 백엔드 서버" -ForegroundColor White
Write-Host " - mail-to-notion-watchdog: 헬스체크 워치독" -ForegroundColor White
Write-Host " - Windows 부팅 시 자동 시작됩니다" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n상태 확인: pm2 status"
Write-Host "로그 확인: pm2 logs"
Write-Host "워치독 로그: type logs\watchdog.log"
