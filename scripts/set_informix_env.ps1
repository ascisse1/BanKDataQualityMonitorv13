# Script de configuration des variables d'environnement Informix pour Windows
# Ce script doit être exécuté avant de lancer l'application Node.js

Write-Host "🔧 Configuration des variables d'environnement Informix..." -ForegroundColor Cyan
Write-Host ""

# Définir le répertoire Informix (adapter si différent)
$env:INFORMIXDIR = "C:\Program Files\Informix Client-SDK"

# Ajouter le dossier bin d'Informix au PATH
$env:PATH += ";$env:INFORMIXDIR\bin"

# Définir les locales pour correspondre au serveur AIX
# Serveur : en_US.819
# Client Windows : en_US.utf8
$env:DB_LOCALE = "en_US.819"
$env:CLIENT_LOCALE = "en_US.utf8"
$env:LANG = "en_US.utf8"

Write-Host "✅ Variables d'environnement configurées :" -ForegroundColor Green
Write-Host ""
Write-Host "   INFORMIXDIR     = $env:INFORMIXDIR" -ForegroundColor Yellow
Write-Host "   PATH            = ...;$env:INFORMIXDIR\bin" -ForegroundColor Yellow
Write-Host "   DB_LOCALE       = $env:DB_LOCALE" -ForegroundColor Yellow
Write-Host "   CLIENT_LOCALE   = $env:CLIENT_LOCALE" -ForegroundColor Yellow
Write-Host "   LANG            = $env:LANG" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Vous pouvez maintenant exécuter :" -ForegroundColor Cyan
Write-Host "   npm run test:dsn      # Tester la connexion DSN" -ForegroundColor White
Write-Host "   npm run test:manual   # Tester la connexion manuelle" -ForegroundColor White
Write-Host "   npm run dev:full      # Lancer l'application complète" -ForegroundColor White
Write-Host ""
