# =============================================================================
# BSIC Bank - Development Environment Setup (Windows PowerShell)
# Amplitude CBS with Informix on Docker
# =============================================================================

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$DatabaseDir = Join-Path $ProjectRoot "database"
$DockerDir = Join-Path $ProjectRoot "docker"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "BSIC Bank - Development Environment Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"

# Step 1: Generate dev data (1K clients)
Write-Host ""
Write-Host "[1/5] Generating development seed data (1K clients)..." -ForegroundColor Yellow
Set-Location $DatabaseDir

# Check if Python is available
$pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
& $pythonCmd generate_amplitude_data.py --env dev

if (-not (Test-Path "amplitude_seed_data_1k_informix.sql")) {
    Write-Host "FAILED: Could not generate seed data" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dev data generated: amplitude_seed_data_1k_informix.sql" -ForegroundColor Green

# Step 2: Start Informix container
Write-Host ""
Write-Host "[2/5] Starting Informix Docker container..." -ForegroundColor Yellow
Set-Location $DockerDir

# Stop existing container if running
docker-compose -f docker-compose.informix.yml down 2>$null

# Start fresh
docker-compose -f docker-compose.informix.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Could not start Docker container" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Informix container started" -ForegroundColor Green

# Step 3: Wait for Informix to be ready
Write-Host ""
Write-Host "[3/5] Waiting for Informix to be ready..." -ForegroundColor Yellow
Write-Host "      (This may take 1-2 minutes on first start)"

$maxAttempts = 40
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 5
    $attempt++

    # Check if container is running
    $containerStatus = docker inspect -f '{{.State.Running}}' bsic-informix-cbs 2>$null
    if ($containerStatus -ne "true") {
        Write-Host "      Container not running yet... ($attempt/$maxAttempts)"
        continue
    }

    # Try to connect to Informix
    $result = docker exec bsic-informix-cbs bash -c "echo 'SELECT 1 FROM systables WHERE tabid=1' | dbaccess sysmaster 2>/dev/null" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Informix is ready!" -ForegroundColor Green
        $ready = $true
        break
    }

    Write-Host "      Waiting for Informix... ($attempt/$maxAttempts)"
}

if (-not $ready) {
    Write-Host "FAILED: Timeout waiting for Informix" -ForegroundColor Red
    Write-Host "Check logs: docker logs bsic-informix-cbs" -ForegroundColor Yellow
    exit 1
}

# Step 4: Copy SQL files into container
Write-Host ""
Write-Host "[4/5] Copying SQL files to container..." -ForegroundColor Yellow

# Create directory in container
docker exec bsic-informix-cbs mkdir -p /opt/ibm/database

# Copy DDL file
$ddlFile = Join-Path $DatabaseDir "amplitude_ddl_informix.sql"
docker cp $ddlFile "bsic-informix-cbs:/opt/ibm/database/amplitude_ddl_informix.sql"
Write-Host "      Copied: amplitude_ddl_informix.sql"

# Copy seed data file
$seedFile = Join-Path $DatabaseDir "amplitude_seed_data_1k_informix.sql"
docker cp $seedFile "bsic-informix-cbs:/opt/ibm/database/amplitude_seed_data_1k_informix.sql"
Write-Host "      Copied: amplitude_seed_data_1k_informix.sql"

Write-Host "[OK] SQL files copied to container" -ForegroundColor Green

# Step 5: Load schema and data
Write-Host ""
Write-Host "[5/5] Loading schema and seed data..." -ForegroundColor Yellow

# Create database
Write-Host "      Creating database 'amplitude'..."
docker exec bsic-informix-cbs bash -c "echo 'CREATE DATABASE amplitude WITH LOG' | dbaccess sysmaster 2>/dev/null" 2>$null

# Load DDL
Write-Host "      Loading DDL schema..."
docker exec bsic-informix-cbs bash -c "dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: DDL load returned non-zero exit code (tables may already exist)" -ForegroundColor Yellow
}

# Load seed data
Write-Host "      Loading seed data (1K clients)..."
docker exec bsic-informix-cbs bash -c "dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Seed data load had issues" -ForegroundColor Yellow
}

# Verify data
Write-Host ""
Write-Host "      Verifying data..."
docker exec bsic-informix-cbs bash -c "echo 'SELECT COUNT(*) FROM bkcli' | dbaccess amplitude 2>/dev/null"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "[OK] Development environment ready!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection details:" -ForegroundColor White
Write-Host "  Host:     localhost"
Write-Host "  Port:     9088"
Write-Host "  Database: amplitude"
Write-Host "  User:     informix"
Write-Host ""
Write-Host "JDBC URL:" -ForegroundColor White
Write-Host "  jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  # Connect to Informix SQL"
Write-Host "  docker exec -it bsic-informix-cbs dbaccess amplitude"
Write-Host ""
Write-Host "  # View container logs"
Write-Host "  docker logs -f bsic-informix-cbs"
Write-Host ""
Write-Host "  # Stop container"
Write-Host "  docker-compose -f docker/docker-compose.informix.yml down"
Write-Host ""
Write-Host "  # Run Spring Boot with Docker profile"
Write-Host "  cd backend-java; mvn spring-boot:run -Dspring-boot.run.profiles=docker"
Write-Host ""

Set-Location $ProjectRoot
