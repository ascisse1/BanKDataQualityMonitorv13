# Quick Start - Backend JDBC Informix

## Démarrage Rapide en 5 minutes

### 1. Prérequis

```bash
# Vérifier Java (minimum 17)
java -version

# Vérifier Maven
mvn -version
```

Si non installés:
- Java: https://adoptium.net/
- Maven: https://maven.apache.org/download.cgi

### 2. Configuration

Créer `.env` à la racine du projet:

```bash
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bank_data_quality

# Informix CBS
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=your_password
```

### 3. Test de Connexion

```bash
cd backend-java
./test-jdbc-connection.sh
```

Ce script va:
- Vérifier Java et Maven
- Tester la connectivité réseau
- Builder le projet
- Tester la connexion JDBC Informix

### 4. Démarrer l'Application

```bash
# Méthode 1: Via Maven (recommandé pour développement)
mvn spring-boot:run

# Méthode 2: Via JAR (recommandé pour production)
mvn clean package
java -jar target/data-quality-backend-1.0.0.jar
```

L'application démarre sur http://localhost:8080

### 5. Tester l'API

```bash
# Health check
curl http://localhost:8080/api/reconciliation/health

# Actuator
curl http://localhost:8080/actuator/health

# Métriques Prometheus
curl http://localhost:8080/actuator/prometheus
```

## Résolution Rapide des Problèmes

### Erreur: "No suitable driver found"

```bash
# Re-télécharger le driver
mvn dependency:purge-local-repository -DmanualInclude=com.ibm.informix:jdbc
mvn clean install
```

### Erreur: "Connection refused"

```bash
# Tester la connectivité
telnet 10.3.0.66 1526
ping 10.3.0.66

# Vérifier le firewall
# Windows:
netstat -an | findstr 1526

# Linux:
sudo netstat -tulpn | grep 1526
```

### Erreur: "SQL Error -951"

Ajouter dans application.yml:
```yaml
spring.datasource.informix.jdbc-url: ...;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

## Structure du Projet

```
backend-java/
├── src/main/java/com/bsic/dataqualitybackend/
│   ├── config/
│   │   └── DataSourceConfig.java          # Configuration multi-datasource
│   ├── controller/
│   │   └── ReconciliationController.java  # Endpoints REST
│   ├── service/
│   │   └── ReconciliationService.java     # Logique métier
│   └── repository/
│       └── InformixRepository.java        # Accès CBS JDBC
├── src/main/resources/
│   └── application.yml                     # Configuration Spring
├── pom.xml                                 # Dépendances Maven
└── test-jdbc-connection.sh                # Script de test
```

## Endpoints Disponibles

```bash
# Réconciliation
GET  /api/reconciliation/pending
POST /api/reconciliation/{id}/reconcile
POST /api/reconciliation/reconcile-all
GET  /api/reconciliation/stats
GET  /api/reconciliation/history

# Health & Monitoring
GET  /api/reconciliation/health
GET  /actuator/health
GET  /actuator/metrics
GET  /actuator/prometheus
```

## Documentation Complète

- [Backend README](README.md)
- [JDBC Informix Setup](../JDBC_INFORMIX_SETUP.md)
- [CBS Architecture](../CBS_RECONCILIATION_ARCHITECTURE.md)

## Support

En cas de problème, consulter les logs:
```bash
tail -f logs/application.log
```

Ou activer le mode DEBUG:
```bash
java -jar target/data-quality-backend-1.0.0.jar --logging.level.com.bsic=DEBUG
```
