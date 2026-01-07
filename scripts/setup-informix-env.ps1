# Script de configuration des variables d'environnement Informix
# À exécuter en tant qu'administrateur

Write-Host "Configuration Informix Client" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$informixDir = "C:\Program Files (x86)\Informix\Connect"

# Vérifier que le répertoire existe
if (-Not (Test-Path $informixDir)) {
    Write-Host "Erreur: Le répertoire Informix n'existe pas:" -ForegroundColor Red
    Write-Host "   $informixDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez vérifier votre installation Informix." -ForegroundColor Yellow
    exit 1
}

Write-Host "Informix trouvé: $informixDir" -ForegroundColor Green
Write-Host ""

# Configurer INFORMIXDIR
Write-Host "1. Configuration de INFORMIXDIR..." -ForegroundColor Cyan
try {
    [System.Environment]::SetEnvironmentVariable("INFORMIXDIR", $informixDir, "Machine")
    $env:INFORMIXDIR = $informixDir
    Write-Host "   INFORMIXDIR = $informixDir" -ForegroundColor Green
} catch {
    Write-Host "   Erreur lors de la configuration de INFORMIXDIR" -ForegroundColor Red
    Write-Host "   Assurez-vous d'exécuter ce script en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# Ajouter bin au PATH
Write-Host ""
Write-Host "2. Ajout au PATH..." -ForegroundColor Cyan
$binPath = "$informixDir\bin"
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")

if ($currentPath -notlike "*$binPath*") {
    try {
        $newPath = "$currentPath;$binPath"
        [System.Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
        $env:PATH = "$env:PATH;$binPath"
        Write-Host "   Ajoute au PATH: $binPath" -ForegroundColor Green
    } catch {
        Write-Host "   Erreur lors de l'ajout au PATH" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   Deja dans le PATH" -ForegroundColor Yellow
}

# Créer le répertoire etc s'il n'existe pas
Write-Host ""
Write-Host "3. Configuration du fichier sqlhosts..." -ForegroundColor Cyan
$etcDir = "$informixDir\etc"
if (-Not (Test-Path $etcDir)) {
    New-Item -ItemType Directory -Path $etcDir -Force | Out-Null
    Write-Host "   Repertoire etc cree: $etcDir" -ForegroundColor Green
} else {
    Write-Host "   Repertoire etc existe: $etcDir" -ForegroundColor Green
}

# Configurer INFORMIXSQLHOSTS
try {
    $sqlhostsPath = "$etcDir\sqlhosts"
    [System.Environment]::SetEnvironmentVariable("INFORMIXSQLHOSTS", $sqlhostsPath, "Machine")
    $env:INFORMIXSQLHOSTS = $sqlhostsPath
    Write-Host "   INFORMIXSQLHOSTS = $sqlhostsPath" -ForegroundColor Green
} catch {
    Write-Host "   Erreur lors de la configuration de INFORMIXSQLHOSTS" -ForegroundColor Red
    exit 1
}

# Créer le fichier sqlhosts
$sqlhostsContent = @"
# IBM Informix SQL Hosts Configuration
# Format: server_name nettype hostname port

ol_bdmsa onsoctcp 10.3.0.66 1526
"@

$sqlhostsPath = "$etcDir\sqlhosts"
Set-Content -Path $sqlhostsPath -Value $sqlhostsContent -Encoding ASCII
Write-Host "   Fichier sqlhosts cree: $sqlhostsPath" -ForegroundColor Green

# Afficher le contenu
Write-Host ""
Write-Host "4. Contenu du fichier sqlhosts:" -ForegroundColor Cyan
Get-Content $sqlhostsPath | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

# Résumé
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Variables configurees:" -ForegroundColor Cyan
Write-Host "  INFORMIXDIR = $informixDir" -ForegroundColor White
Write-Host "  INFORMIXSQLHOSTS = $sqlhostsPath" -ForegroundColor White
Write-Host "  PATH inclut: $binPath" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  1. Fermez TOUTES les fenetres PowerShell" -ForegroundColor Yellow
Write-Host "  2. Ouvrez une NOUVELLE fenetre PowerShell" -ForegroundColor Yellow
Write-Host "  3. Testez la connexion:" -ForegroundColor Yellow
Write-Host "     npm run test:informix" -ForegroundColor White
Write-Host ""
