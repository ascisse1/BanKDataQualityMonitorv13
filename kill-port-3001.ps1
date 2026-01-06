# Script PowerShell pour libérer le port 3001
Write-Host "🔍 Recherche du processus utilisant le port 3001..." -ForegroundColor Cyan

$port = 3001
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

        if ($process) {
            Write-Host "✅ Processus trouvé: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
            Write-Host "⚠️  Arrêt du processus..." -ForegroundColor Red

            Stop-Process -Id $processId -Force
            Write-Host "✅ Processus $processId arrêté avec succès" -ForegroundColor Green
        }
    }
} else {
    Write-Host "ℹ️  Aucun processus n'utilise le port 3001" -ForegroundColor Green
}

Write-Host "`n✅ Le port 3001 est maintenant libre" -ForegroundColor Green
Write-Host "Vous pouvez maintenant exécuter: npm run dev:full" -ForegroundColor Cyan
