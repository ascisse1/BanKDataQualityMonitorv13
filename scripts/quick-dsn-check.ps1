# Quick DSN Diagnostic for Informix
Write-Host ""
Write-Host "Quick Informix DSN Diagnostic" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check ping
Write-Host "Testing network connectivity to 10.3.0.66..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName 10.3.0.66 -Count 2 -Quiet
if ($pingResult) {
    Write-Host "  OK - Server is reachable" -ForegroundColor Green
} else {
    Write-Host "  FAIL - Server is not reachable" -ForegroundColor Red
}

# Check port
Write-Host ""
Write-Host "Testing port 1526..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect("10.3.0.66", 1526, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
    if ($wait) {
        $tcpClient.EndConnect($connection)
        Write-Host "  OK - Port 1526 is open" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "  FAIL - Port 1526 timeout" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Port 1526 closed" -ForegroundColor Red
}

# Check environment variables
Write-Host ""
Write-Host "Checking Informix environment variables..." -ForegroundColor Yellow
$informixDir = $env:INFORMIXDIR
$informixServer = $env:INFORMIXSERVER
$dbLocale = $env:DB_LOCALE
$clientLocale = $env:CLIENT_LOCALE

if ($informixDir) {
    Write-Host "  OK - INFORMIXDIR = $informixDir" -ForegroundColor Green
} else {
    Write-Host "  MISSING - INFORMIXDIR not set" -ForegroundColor Red
}

if ($informixServer) {
    Write-Host "  OK - INFORMIXSERVER = $informixServer" -ForegroundColor Green
} else {
    Write-Host "  MISSING - INFORMIXSERVER not set" -ForegroundColor Red
}

if ($dbLocale) {
    Write-Host "  OK - DB_LOCALE = $dbLocale" -ForegroundColor Green
} else {
    Write-Host "  MISSING - DB_LOCALE not set" -ForegroundColor Yellow
}

if ($clientLocale) {
    Write-Host "  OK - CLIENT_LOCALE = $clientLocale" -ForegroundColor Green
} else {
    Write-Host "  MISSING - CLIENT_LOCALE not set" -ForegroundColor Yellow
}

# Check DSN
Write-Host ""
Write-Host "Checking DSN configuration..." -ForegroundColor Yellow
$dsnPath = "HKLM:\SOFTWARE\ODBC\ODBC.INI\lcb"
$dsnExists = Test-Path $dsnPath

if ($dsnExists) {
    Write-Host "  OK - DSN 'lcb' found" -ForegroundColor Green
    $dsnConfig = Get-ItemProperty -Path $dsnPath -ErrorAction SilentlyContinue
    Write-Host "    Server: $($dsnConfig.Server)" -ForegroundColor Gray
    Write-Host "    Host: $($dsnConfig.Host)" -ForegroundColor Gray
} else {
    Write-Host "  FAIL - DSN 'lcb' not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Run Node.js test
Write-Host "Running connection test..." -ForegroundColor Yellow
npm run test:dsn
