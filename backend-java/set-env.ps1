# Variables d'environnement pour MySQL
$env:DB_URL = "jdbc:mysql://localhost:3306/bank_data_quality?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USER = "root"
$env:DB_PASSWORD = "Bamako@2209"

# Variables d'environnement pour Informix (optionnel)
$env:INFORMIX_HOST = "10.3.0.66"
$env:INFORMIX_PORT = "1526"
$env:INFORMIX_DATABASE = "bdmsa"
$env:INFORMIX_SERVER = "ol_bdmsa"
$env:INFORMIX_USER = "bank"
$env:INFORMIX_PASSWORD = "bank"

# Profile Spring Boot
$env:SPRING_PROFILES_ACTIVE = "local"

Write-Host "Variables d'environnement configurees avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "MySQL:" -ForegroundColor Cyan
Write-Host "  URL: $env:DB_URL"
Write-Host "  User: $env:DB_USER"
Write-Host "  Password: ****"
Write-Host ""
Write-Host "Vous pouvez maintenant lancer: mvn spring-boot:run -DskipTests" -ForegroundColor Yellow
