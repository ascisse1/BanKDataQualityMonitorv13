# Guide de Configuration JDBC Informix - Spring Boot

## Vue d'ensemble

Ce guide explique comment configurer une connexion JDBC à Informix Core Banking System avec Spring Boot pour la réconciliation des données.

## Avantages JDBC vs ODBC

| Aspect | JDBC | ODBC |
|--------|------|------|
| **Plateforme** | Cross-platform Java | Spécifique OS (Windows, Linux) |
| **Performance** | Meilleur pooling, optimisé Java | Bon mais limité |
| **Stabilité** | Très stable, mature | Dépend des drivers OS |
| **Configuration** | Simple (fichier .env + YAML) | Complexe (DSN, registry) |
| **Déploiement** | Un seul JAR portable | Drivers OS à installer partout |
| **Monitoring** | JMX, Actuator, logs riches | Limité |
| **Transactions** | Natif Spring @Transactional | Gestion manuelle |

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│           Spring Boot Application (Port 8080)              │
│                                                            │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │  MySQL DataSource│         │ Informix DataSource│      │
│  │  (Primary)       │         │  (CBS)            │       │
│  │                  │         │                   │       │
│  │  HikariCP Pool   │         │  HikariCP Pool    │       │
│  │  Max: 20         │         │  Max: 10          │       │
│  └────────┬─────────┘         └────────┬──────────┘       │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            ↓                              ↓
   ┌────────────────┐           ┌─────────────────┐
   │  MySQL Server  │           │ Informix Server │
   │  Port 3306     │           │  Port 1526      │
   │                │           │  (Core Banking) │
   │  • Users       │           │  • bkcli        │
   │  • Tickets     │           │  • Clients      │
   │  • Anomalies   │           │  • Accounts     │
   └────────────────┘           └─────────────────┘
```

## Prérequis

### 1. Java Development Kit (JDK)

```bash
# Vérifier la version de Java (minimum 17)
java -version

# Si nécessaire, installer OpenJDK 17
# Windows: https://adoptium.net/
# Linux:
sudo apt install openjdk-17-jdk
```

### 2. Maven

```bash
# Vérifier Maven
mvn -version

# Installer Maven si nécessaire
# Windows: https://maven.apache.org/download.cgi
# Linux:
sudo apt install maven
```

### 3. Driver JDBC Informix

Le driver est déjà configuré dans `pom.xml`:

```xml
<dependency>
    <groupId>com.ibm.informix</groupId>
    <artifactId>jdbc</artifactId>
    <version>4.50.10</version>
    <scope>runtime</scope>
</dependency>
```

Maven téléchargera automatiquement le driver lors du build.

## Configuration

### Étape 1: Variables d'Environnement

Créer/modifier le fichier `.env` à la racine du projet:

```bash
# ===========================================
# MYSQL DATABASE (Application)
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bank_data_quality

# ===========================================
# INFORMIX CBS (Core Banking)
# ===========================================
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=your_informix_password

# ===========================================
# SPRING BOOT
# ===========================================
SERVER_PORT=8080
JWT_SECRET=your-secret-key-minimum-256-bits
```

### Étape 2: Vérifier application.yml

Le fichier `backend-java/src/main/resources/application.yml` est déjà configuré:

```yaml
spring:
  datasource:
    primary:
      jdbc-url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:bank_data_quality}
      username: ${DB_USER:root}
      password: ${DB_PASSWORD:}
      driver-class-name: com.mysql.cj.jdbc.Driver

    informix:
      jdbc-url: jdbc:informix-sqli://${INFORMIX_HOST}:${INFORMIX_PORT}/${INFORMIX_DATABASE}:INFORMIXSERVER=${INFORMIX_SERVER}
      username: ${INFORMIX_USER:bank}
      password: ${INFORMIX_PASSWORD:bank}
      driver-class-name: com.informix.jdbc.IfxDriver
```

### Étape 3: URL JDBC Informix Expliquée

Format:
```
jdbc:informix-sqli://HOST:PORT/DATABASE:INFORMIXSERVER=SERVER_NAME;OPTION1=VALUE1;OPTION2=VALUE2
```

Exemple complet:
```
jdbc:informix-sqli://10.3.0.66:1526/bdmsa:INFORMIXSERVER=ol_bdmsa;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

**Paramètres importants:**
- `INFORMIXSERVER`: Nom du serveur Informix (requis)
- `DELIMIDENT=Y`: Permet l'utilisation d'identifiants délimités
- `DB_LOCALE`: Encodage base de données
- `CLIENT_LOCALE`: Encodage client
- `OPTOFC=1`: Optimisations curseurs
- `OPTCOMPIND=2`: Optimisations compilation

### Étape 4: Configuration HikariCP

HikariCP est le pool de connexions le plus rapide pour Java. Configuration dans `DataSourceConfig.java`:

```java
HikariConfig config = new HikariConfig();
config.setJdbcUrl(jdbcUrl);
config.setUsername(user);
config.setPassword(password);
config.setDriverClassName("com.informix.jdbc.IfxDriver");

// Pool settings
config.setMaximumPoolSize(10);        // Max 10 connexions simultanées
config.setMinimumIdle(2);             // Min 2 connexions en idle
config.setConnectionTimeout(30000);    // Timeout 30s
config.setIdleTimeout(300000);        // Idle timeout 5min
config.setMaxLifetime(1800000);       // Max lifetime 30min
config.setConnectionTestQuery("SELECT FIRST 1 1 FROM systables");
```

## Installation et Build

### Étape 1: Installer les Dépendances

```bash
cd backend-java
mvn clean install
```

Cela va:
1. Télécharger toutes les dépendances (dont le driver Informix JDBC)
2. Compiler le projet
3. Créer le JAR exécutable

### Étape 2: Tester la Connexion

Créer un test simple:

```java
// src/test/java/com/bsic/dataqualitybackend/InformixConnectionTest.java
@SpringBootTest
class InformixConnectionTest {

    @Autowired
    @Qualifier("informixJdbcTemplate")
    private JdbcTemplate informixJdbcTemplate;

    @Test
    void testConnection() {
        Integer result = informixJdbcTemplate.queryForObject(
            "SELECT FIRST 1 1 FROM systables",
            Integer.class
        );
        assertNotNull(result);
        assertEquals(1, result);
    }

    @Test
    void testClientQuery() {
        List<Map<String, Object>> clients = informixJdbcTemplate.queryForList(
            "SELECT FIRST 10 cli, nom, pre FROM bkcli"
        );
        assertFalse(clients.isEmpty());
    }
}
```

Exécuter les tests:
```bash
mvn test
```

### Étape 3: Lancer l'Application

```bash
# Méthode 1: Via Maven
mvn spring-boot:run

# Méthode 2: Via JAR
mvn package
java -jar target/data-quality-backend-1.0.0.jar

# Méthode 3: Avec profil spécifique
java -jar -Dspring.profiles.active=production target/data-quality-backend-1.0.0.jar
```

L'application démarre sur le port 8080.

## Utilisation de l'API

### Endpoints Disponibles

#### 1. Health Check
```bash
curl http://localhost:8080/api/reconciliation/health
```

Réponse:
```json
{
  "status": "UP",
  "service": "Reconciliation Service",
  "timestamp": "2025-01-04T10:00:00"
}
```

#### 2. Tâches en Attente
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8080/api/reconciliation/pending?agencyCode=AG001"
```

#### 3. Réconcilier une Tâche
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/reconciliation/TASK_ID/reconcile
```

#### 4. Réconciliation en Batch
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agency_code":"AG001","max_tasks":50}' \
  http://localhost:8080/api/reconciliation/reconcile-all
```

#### 5. Statistiques
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8080/api/reconciliation/stats?agencyCode=AG001"
```

## Code Java - Exemples

### Requête Simple

```java
@Autowired
private InformixRepository informixRepository;

public void getClientData(String clientId) {
    Map<String, Object> client = informixRepository.getClientById(clientId);
    System.out.println("Client: " + client.get("name"));
}
```

### Requête Personnalisée

```java
String sql = """
    SELECT FIRST 100
        cli as client_id,
        nom as name,
        pre as firstname,
        adr as address
    FROM bkcli
    WHERE age = ?
    ORDER BY nom
""";

List<Map<String, Object>> clients = informixRepository.executeCustomQueryList(
    sql,
    "AG001"
);
```

### Transaction avec Mise à Jour

```java
@Transactional
public void updateClientInCBS(String clientId, String newAddress) {
    Map<String, Object> updates = new HashMap<>();
    updates.put("adr", newAddress);
    updates.put("dma", LocalDate.now());  // Date de modification

    boolean success = informixRepository.updateClient(clientId, updates);

    if (!success) {
        throw new RuntimeException("Update failed");
    }
}
```

## Monitoring et Logs

### Actuator Endpoints

Spring Boot Actuator expose des métriques:

```bash
# Health check
curl http://localhost:8080/actuator/health

# Métriques
curl http://localhost:8080/actuator/metrics

# Pool de connexions
curl http://localhost:8080/actuator/metrics/hikari.connections.active
```

### Logs de Connexion

Les logs sont configurés dans `application.yml`:

```yaml
logging:
  level:
    com.zaxxer.hikari: DEBUG
    com.informix.jdbc: DEBUG
  file:
    name: logs/application.log
```

Exemple de log:
```
2025-01-04 10:00:00 - HikariPool-2 - Starting InformixPool
2025-01-04 10:00:01 - HikariPool-2 - Added connection com.informix.jdbc.IfxConnection@12345
2025-01-04 10:00:05 - Reconciliation completed for task abc123: 8/10 fields matched
```

### Métriques Prometheus

Accéder aux métriques:
```bash
curl http://localhost:8080/actuator/prometheus
```

Métriques importantes:
- `hikari_connections_active`: Connexions actives
- `hikari_connections_idle`: Connexions idle
- `hikari_connections_pending`: Connexions en attente
- `hikari_connection_timeout_total`: Timeouts
- `jdbc_connections_max`: Maximum de connexions

## Dépannage

### Erreur: "No suitable driver found"

**Cause**: Driver JDBC Informix non trouvé.

**Solution**:
```bash
# Vérifier que le driver est téléchargé
ls ~/.m2/repository/com/ibm/informix/jdbc/

# Re-télécharger si nécessaire
mvn dependency:purge-local-repository -DmanualInclude=com.ibm.informix:jdbc
mvn clean install
```

### Erreur: "Connection refused"

**Cause**: Serveur Informix non accessible.

**Solutions**:
```bash
# Tester la connectivité réseau
ping 10.3.0.66
telnet 10.3.0.66 1526

# Vérifier le firewall
# Windows:
netstat -an | findstr 1526

# Linux:
sudo netstat -tulpn | grep 1526
```

### Erreur: "SQL Error -951: Incorrect SQLCA"

**Cause**: Problème de locale Informix.

**Solution**: Ajouter dans l'URL JDBC:
```
;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

### Erreur: "Pool exhausted"

**Cause**: Toutes les connexions du pool sont utilisées.

**Solutions**:
1. Augmenter la taille du pool:
```yaml
spring.datasource.informix.hikari.maximum-pool-size: 20
```

2. Réduire le temps de rétention:
```yaml
spring.datasource.informix.hikari.max-lifetime: 900000  # 15min
```

3. Vérifier les connexions qui ne se ferment pas:
```java
// Toujours utiliser try-with-resources
try (Connection conn = dataSource.getConnection()) {
    // ...
}
```

### Performance Lente

**Solutions**:
1. Activer le cache des statements:
```
;STMT_CACHE=1
```

2. Optimiser les queries:
```sql
-- Utiliser FIRST au lieu de LIMIT
SELECT FIRST 100 * FROM bkcli

-- Créer des index
CREATE INDEX idx_cli ON bkcli(cli);
```

3. Augmenter le pool size pour plus de parallélisme

## Sécurité

### Credentials

Ne jamais coder en dur les credentials:

```java
// ❌ MAL
String password = "bank123";

// ✅ BON
String password = System.getenv("INFORMIX_PASSWORD");
```

### Injection SQL

Toujours utiliser des paramètres préparés:

```java
// ❌ MAL - Vulnérable à l'injection SQL
String sql = "SELECT * FROM bkcli WHERE cli = '" + clientId + "'";

// ✅ BON - Paramètres préparés
String sql = "SELECT * FROM bkcli WHERE cli = ?";
jdbcTemplate.queryForMap(sql, clientId);
```

### Logs

Ne jamais logger les passwords:

```java
log.info("Connecting to Informix at {}", host);  // ✅ OK
log.info("Password: {}", password);  // ❌ JAMAIS
```

## Déploiement

### Build de Production

```bash
mvn clean package -DskipTests
```

Cela crée un JAR standalone dans `target/`:
```
data-quality-backend-1.0.0.jar
```

### Docker

```dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/data-quality-backend-1.0.0.jar app.jar

ENV DB_HOST=mysql-server \
    INFORMIX_HOST=informix-server \
    SERVER_PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

Build et run:
```bash
docker build -t bsic-backend .
docker run -p 8080:8080 \
  -e INFORMIX_HOST=10.3.0.66 \
  -e INFORMIX_PASSWORD=secret \
  bsic-backend
```

### Systemd Service (Linux)

```ini
[Unit]
Description=BSIC Data Quality Backend
After=network.target

[Service]
Type=simple
User=bsic
WorkingDirectory=/opt/bsic
ExecStart=/usr/bin/java -jar /opt/bsic/data-quality-backend-1.0.0.jar
Restart=always
Environment="INFORMIX_HOST=10.3.0.66"
Environment="INFORMIX_PASSWORD=secret"

[Install]
WantedBy=multi-user.target
```

Activer:
```bash
sudo systemctl enable bsic-backend
sudo systemctl start bsic-backend
sudo systemctl status bsic-backend
```

## Comparaison Node.js (ODBC) vs Spring Boot (JDBC)

| Aspect | Node.js + ODBC | Spring Boot + JDBC |
|--------|----------------|-------------------|
| Setup | Complexe (DSN, drivers OS) | Simple (Maven) |
| Performance | Bon | Excellent (pool optimisé) |
| Stabilité | Moyen | Élevé |
| Transactions | Manuel | @Transactional |
| Monitoring | Limité | Actuator + Prometheus |
| Scalabilité | Moyen | Excellent |
| Maintenance | Difficile | Facile |
| Déploiement | Multi-étapes | Un seul JAR |
| Logs | Console basique | SLF4J/Logback riche |

## Conclusion

JDBC avec Spring Boot offre une solution robuste, performante et facile à maintenir pour se connecter au CBS Informix. Les avantages incluent:

- Configuration simple via fichiers YAML
- Pool de connexions optimisé HikariCP
- Monitoring intégré avec Actuator
- Gestion des transactions Spring
- Déploiement facile (un seul JAR)
- Cross-platform sans dépendances OS

Le code est dans:
- `backend-java/src/main/java/com/bsic/dataqualitybackend/config/DataSourceConfig.java`
- `backend-java/src/main/java/com/bsic/dataqualitybackend/repository/InformixRepository.java`
- `backend-java/src/main/java/com/bsic/dataqualitybackend/service/ReconciliationService.java`
- `backend-java/src/main/java/com/bsic/dataqualitybackend/controller/ReconciliationController.java`
