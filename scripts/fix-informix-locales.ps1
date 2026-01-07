# Fix Informix Locale Configuration
# This script sets the required environment variables to fix error -23101

Write-Host ""
Write-Host "Fixing Informix Locale Configuration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Right-click on PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Setting Informix environment variables..." -ForegroundColor Yellow
Write-Host ""

# Set INFORMIXDIR
$informixDir = "C:\Informix"
[System.Environment]::SetEnvironmentVariable('INFORMIXDIR', $informixDir, 'Machine')
Write-Host "  INFORMIXDIR = $informixDir" -ForegroundColor Green

# Set INFORMIXSERVER
$informixServer = "ol_bdmsa"
[System.Environment]::SetEnvironmentVariable('INFORMIXSERVER', $informixServer, 'Machine')
Write-Host "  INFORMIXSERVER = $informixServer" -ForegroundColor Green

# Set DB_LOCALE
$dbLocale = "en_US.819"
[System.Environment]::SetEnvironmentVariable('DB_LOCALE', $dbLocale, 'Machine')
Write-Host "  DB_LOCALE = $dbLocale" -ForegroundColor Green

# Set CLIENT_LOCALE
$clientLocale = "en_US.utf8"
[System.Environment]::SetEnvironmentVariable('CLIENT_LOCALE', $clientLocale, 'Machine')
Write-Host "  CLIENT_LOCALE = $clientLocale" -ForegroundColor Green

# Add Informix bin to PATH if not already present
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$informixBin = "$informixDir\bin"

if ($currentPath -notlike "*$informixBin*") {
    $newPath = "$currentPath;$informixBin"
    [System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
    Write-Host "  Added $informixBin to PATH" -ForegroundColor Green
} else {
    Write-Host "  PATH already contains Informix bin" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You must restart your PowerShell session for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restarting, test the connection with:" -ForegroundColor Cyan
Write-Host "  npm run test:dsn" -ForegroundColor White
Write-Host ""
