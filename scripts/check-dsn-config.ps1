# Script pour vérifier la configuration du DSN Informix
# Ce script lit directement le registre Windows pour afficher la configuration du DSN

Write-Host "🔍 Vérification de la configuration du DSN Informix" -ForegroundColor Cyan
Write-Host ""

$dsnName = "lcb"

# Chemins de registre pour les DSN système (64-bit et 32-bit)
$registryPaths = @(
    "HKLM:\SOFTWARE\ODBC\ODBC.INI\$dsnName",
    "HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBC.INI\$dsnName"
)

$dsnFound = $false

foreach ($path in $registryPaths) {
    if (Test-Path $path) {
        $dsnFound = $true
        Write-Host "✅ DSN '$dsnName' trouvé dans: $path" -ForegroundColor Green
        Write-Host ""

        # Lire toutes les propriétés du DSN
        $properties = Get-ItemProperty -Path $path

        # Paramètres critiques à vérifier
        $criticalParams = @{
            "Host" = $null
            "Server" = $null
            "Service" = $null
            "Protocol" = $null
            "Database" = $null
            "Driver" = $null
        }

        Write-Host "📋 Configuration du DSN:" -ForegroundColor Yellow
        Write-Host ""

        foreach ($key in $criticalParams.Keys) {
            $value = $properties.$key
            if ($value) {
                if ($key -eq "Server") {
                    # Vérification spéciale pour Server Name
                    if ($value -eq "ol_bdmsa") {
                        Write-Host "   ✅ $key = $value" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  $key = $value (devrait être 'ol_bdmsa')" -ForegroundColor Red
                    }
                } elseif ($key -eq "Service") {
                    if ($value -eq "1526") {
                        Write-Host "   ✅ $key = $value" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  $key = $value (devrait être '1526')" -ForegroundColor Yellow
                    }
                } elseif ($key -eq "Host") {
                    if ($value -eq "10.3.0.66") {
                        Write-Host "   ✅ $key = $value" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  $key = $value (devrait être '10.3.0.66')" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ℹ️  $key = $value" -ForegroundColor White
                }
            } else {
                Write-Host "   ❌ $key = (non défini)" -ForegroundColor Red
            }
        }

        Write-Host ""
        Write-Host "📝 Autres paramètres:" -ForegroundColor Yellow
        Write-Host ""

        # Afficher tous les autres paramètres
        $properties.PSObject.Properties | Where-Object {
            $_.Name -notin @('PSPath', 'PSParentPath', 'PSChildName', 'PSDrive', 'PSProvider') -and
            $_.Name -notin $criticalParams.Keys
        } | ForEach-Object {
            Write-Host "   $($_.Name) = $($_.Value)" -ForegroundColor Gray
        }

        Write-Host ""
        break
    }
}

if (-not $dsnFound) {
    Write-Host "❌ DSN '$dsnName' non trouvé dans le registre" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Pour créer le DSN:" -ForegroundColor Yellow
    Write-Host "   1. Ouvrez l'administrateur ODBC: odbcad32.exe" -ForegroundColor White
    Write-Host "   2. Onglet 'System DSN' -> 'Add'" -ForegroundColor White
    Write-Host "   3. Sélectionnez le driver Informix" -ForegroundColor White
    Write-Host "   4. Configurez avec les paramètres corrects" -ForegroundColor White
    Write-Host ""
}

Write-Host "🔧 Actions recommandées:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Vérifier visuellement la configuration:" -ForegroundColor White
Write-Host "   odbcad32.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Tester la connexion avec le diagnostic:" -ForegroundColor White
Write-Host "   npm run diagnose:informix" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Consulter le guide de depannage:" -ForegroundColor White
Write-Host "   Get-Content INFORMIX_ERROR_23101.md" -ForegroundColor Gray
Write-Host ""
