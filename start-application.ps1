# Script PowerShell pour démarrer l'application complète
# BSIC Bank Data Quality Monitor v13

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$WithInformix
)

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BSIC Bank Data Quality Monitor - Démarrage Automatique" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Fonction pour libérer un port
function Free-Port {
    param([int]$Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

            if ($process) {
                Write-Host "⚠️  Port $Port utilisé par: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                $response = Read-Host "Voulez-vous arrêter ce processus ? (O/N)"

                if ($response -eq "O" -or $response -eq "o") {
                    Stop-Process -Id $processId -Force
                    Write-Host "✅ Processus arrêté" -ForegroundColor Green
                    Start-Sleep -Seconds 2
                    return $true
                } else {
                    Write-Host "❌ Démarrage annulé" -ForegroundColor Red
                    return $false
                }
            }
        }
    }
    return $true
}

# 1. Vérification des prérequis
Write-Host "📋 Étape 1/4 : Vérification des prérequis..." -ForegroundColor Yellow
Write-Host ""

# Vérifier Java
$javaVersion = & java -version 2>&1 | Select-String "version"
if ($javaVersion) {
    Write-Host "✅ Java installé: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Java 17+ requis non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
$nodeVersion = & node --version 2>&1
if ($nodeVersion) {
    Write-Host "✅ Node.js installé: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js requis non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier Maven
$mvnVersion = & mvn --version 2>&1 | Select-String "Apache Maven"
if ($mvnVersion) {
    Write-Host "✅ Maven installé: $mvnVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Maven requis non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Vérification des ports
Write-Host "🔌 Étape 2/4 : Vérification des ports..." -ForegroundColor Yellow
Write-Host ""

$portsOK = $true

if (-not $SkipBackend) {
    if (Test-Port 8080) {
        Write-Host "⚠️  Port 8080 (Backend Java) est occupé" -ForegroundColor Yellow
        $portsOK = Free-Port 8080
    } else {
        Write-Host "✅ Port 8080 (Backend Java) est libre" -ForegroundColor Green
    }
}

if (-not $SkipFrontend) {
    if (Test-Port 3001) {
        Write-Host "⚠️  Port 3001 (Node.js Server) est occupé" -ForegroundColor Yellow
        $portsOK = Free-Port 3001
    } else {
        Write-Host "✅ Port 3001 (Node.js Server) est libre" -ForegroundColor Green
    }

    if (Test-Port 5174) {
        Write-Host "⚠️  Port 5174 (Vite Dev Server) est occupé" -ForegroundColor Yellow
        $portsOK = Free-Port 5174
    } else {
        Write-Host "✅ Port 5174 (Vite Dev Server) est libre" -ForegroundColor Green
    }
}

if (-not $portsOK) {
    Write-Host "❌ Impossible de libérer les ports nécessaires" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Configuration Informix
if ($WithInformix) {
    Write-Host "🔧 Étape 3/4 : Configuration Informix..." -ForegroundColor Yellow
    Write-Host "   Activation de l'intégration Informix" -ForegroundColor Cyan

    # Vérifier le DSN ODBC
    $dsnExists = Get-OdbcDsn -Name "lcb" -ErrorAction SilentlyContinue
    if ($dsnExists) {
        Write-Host "✅ DSN ODBC 'lcb' trouvé" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DSN ODBC 'lcb' non trouvé" -ForegroundColor Yellow
        Write-Host "   L'application démarrera en mode dégradé" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Étape 3/4 : Informix désactivé (mode dégradé)" -ForegroundColor Gray
}

Write-Host ""

# 4. Démarrage des services
Write-Host "🚀 Étape 4/4 : Démarrage des services..." -ForegroundColor Yellow
Write-Host ""

$jobs = @()

# Démarrer le backend Java
if (-not $SkipBackend) {
    Write-Host "📦 Démarrage du Backend Java Spring Boot (port 8080)..." -ForegroundColor Cyan

    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PSScriptRoot\backend-java
        & mvn spring-boot:run -DskipTests -Dspring.profiles.active=local
    }

    $jobs += $backendJob
    Write-Host "   Job ID: $($backendJob.Id)" -ForegroundColor Gray
    Write-Host "✅ Backend démarré en arrière-plan" -ForegroundColor Green
    Write-Host ""

    # Attendre que le backend soit prêt
    Write-Host "⏳ Attente du démarrage du backend (30 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Démarrer le frontend
if (-not $SkipFrontend) {
    Write-Host "🎨 Démarrage du Frontend React + Node.js Server..." -ForegroundColor Cyan

    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PSScriptRoot
        & npm run dev:full
    }

    $jobs += $frontendJob
    Write-Host "   Job ID: $($frontendJob.Id)" -ForegroundColor Gray
    Write-Host "✅ Frontend démarré en arrière-plan" -ForegroundColor Green
    Write-Host ""

    # Attendre que le frontend soit prêt
    Write-Host "⏳ Attente du démarrage du frontend (10 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ APPLICATION DÉMARRÉE AVEC SUCCÈS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if (-not $SkipBackend) {
    Write-Host "🔗 Backend API     : http://localhost:8080" -ForegroundColor Cyan
    Write-Host "🔗 Camunda Cockpit : http://localhost:8080/camunda" -ForegroundColor Cyan
    Write-Host "   Username/Password: admin / admin" -ForegroundColor Gray
}

if (-not $SkipFrontend) {
    Write-Host "🔗 Frontend Web    : http://localhost:5174" -ForegroundColor Cyan
    Write-Host "🔗 Node.js API     : http://localhost:3001" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📊 Comptes de test:" -ForegroundColor Yellow
Write-Host "   Admin      : admin / admin" -ForegroundColor White
Write-Host "   Auditeur   : auditor@bsic.sn / auditor123" -ForegroundColor White
Write-Host "   Agence     : agency@bsic.sn / agency123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Logs en temps réel:" -ForegroundColor Yellow

if ($jobs.Count -gt 0) {
    Write-Host "   Receive-Job -Id <JOB_ID> -Keep" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Jobs actifs:" -ForegroundColor Yellow
    foreach ($job in $jobs) {
        Write-Host "   - Job $($job.Id): $($job.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🛑 Pour arrêter l'application:" -ForegroundColor Red
Write-Host "   Ctrl+C puis: Stop-Job -Id <JOB_ID>; Remove-Job -Id <JOB_ID>" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Surveiller les jobs
Write-Host "📡 Surveillance des services (Ctrl+C pour quitter)..." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        foreach ($job in $jobs) {
            if ($job.State -eq "Failed") {
                Write-Host "❌ Job $($job.Id) a échoué!" -ForegroundColor Red
                Receive-Job -Id $job.Id
            }
        }
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Red
    foreach ($job in $jobs) {
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
}
