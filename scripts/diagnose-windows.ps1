# Diagnostic de connexion Informix sur Windows
Write-Host ""
Write-Host "🔍 DIAGNOSTIC DE CONNEXION INFORMIX (WINDOWS)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Test de connectivité réseau
Write-Host "1️⃣ Test de connectivité réseau..." -ForegroundColor Yellow
Write-Host "   Serveur: 10.3.0.66:1526"
$pingResult = Test-Connection -ComputerName 10.3.0.66 -Count 2 -Quiet
if ($pingResult) {
    Write-Host "   ✅ Serveur accessible (ping réussi)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Serveur non accessible (ping échoué)" -ForegroundColor Red
    Write-Host "   Solution: Vérifiez votre connexion réseau/VPN" -ForegroundColor Yellow
}

# 2. Test du port Informix
Write-Host ""
Write-Host "2️⃣ Test du port Informix 1526..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect("10.3.0.66", 1526, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(3000, $false)
    if ($wait) {
        $tcpClient.EndConnect($connection)
        Write-Host "   ✅ Port 1526 ouvert et accessible" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "   ❌ Port 1526 inaccessible (timeout)" -ForegroundColor Red
        Write-Host "   Solution: Vérifiez le firewall ou que le serveur Informix est démarré" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Port 1526 fermé ou bloqué" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Vérification des variables d'environnement Informix
Write-Host ""
Write-Host "3️⃣ Variables d'environnement Informix..." -ForegroundColor Yellow
$informixDir = $env:INFORMIXDIR
$informixServer = $env:INFORMIXSERVER

if ($informixDir) {
    Write-Host "   ✅ INFORMIXDIR = $informixDir" -ForegroundColor Green
} else {
    Write-Host "   ❌ INFORMIXDIR non défini" -ForegroundColor Red
}

if ($informixServer) {
    Write-Host "   ✅ INFORMIXSERVER = $informixServer" -ForegroundColor Green
} else {
    Write-Host "   ❌ INFORMIXSERVER non défini" -ForegroundColor Red
}

if (!$informixDir -or !$informixServer) {
    Write-Host ""
    Write-Host "   Solution: Exécutez le script de configuration:" -ForegroundColor Yellow
    Write-Host "   .\scripts\setup-informix-env.ps1" -ForegroundColor Cyan
}

# 4. Vérification du DSN ODBC
Write-Host ""
Write-Host "4️⃣ Vérification du DSN ODBC 'lcb'..." -ForegroundColor Yellow
$dsnPath = "HKLM:\SOFTWARE\ODBC\ODBC.INI\lcb"
$dsnPath32 = "HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBC.INI\lcb"

$dsnExists = Test-Path $dsnPath
$dsnExists32 = Test-Path $dsnPath32

if ($dsnExists -or $dsnExists32) {
    Write-Host "   ✅ DSN 'lcb' trouvé dans le registre" -ForegroundColor Green

    if ($dsnExists) {
        $dsnConfig = Get-ItemProperty -Path $dsnPath -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "   Configuration du DSN (64-bit):" -ForegroundColor Cyan
        Write-Host "   - Driver: $($dsnConfig.Driver)"
        Write-Host "   - Host: $($dsnConfig.Host)"
        Write-Host "   - Server: $($dsnConfig.Server)"
        Write-Host "   - Protocol: $($dsnConfig.Protocol)"
    }

    if ($dsnExists32) {
        $dsnConfig32 = Get-ItemProperty -Path $dsnPath32 -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "   Configuration du DSN (32-bit):" -ForegroundColor Cyan
        Write-Host "   - Driver: $($dsnConfig32.Driver)"
        Write-Host "   - Host: $($dsnConfig32.Host)"
        Write-Host "   - Server: $($dsnConfig32.Server)"
        Write-Host "   - Protocol: $($dsnConfig32.Protocol)"
    }
} else {
    Write-Host "   ❌ DSN 'lcb' non trouvé" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Solution: Créez le DSN via:" -ForegroundColor Yellow
    Write-Host "   - Panneau de configuration > Outils d'administration" -ForegroundColor Cyan
    Write-Host "   - Sources de données ODBC (64-bit)" -ForegroundColor Cyan
    Write-Host "   - Onglet 'Système' > Ajouter" -ForegroundColor Cyan
    Write-Host "   - Sélectionnez le driver Informix" -ForegroundColor Cyan
}

# 5. Test de connexion ODBC
Write-Host ""
Write-Host "5️⃣ Test de connexion ODBC..." -ForegroundColor Yellow
Write-Host "   Exécution du script Node.js..."
node scripts/diagnose-informix-connection.js

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Diagnostic terminé" -ForegroundColor Cyan
Write-Host ""
