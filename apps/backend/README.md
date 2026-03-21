# Backend Spring Boot - BSIC Data Quality

## Vue d'ensemble

Backend Java Spring Boot pour la gestion de la qualité des données clientèle BSIC avec connexion JDBC au Core Banking System Informix.

## Architecture

```
Spring Boot Application (Port 8080)
├── Controllers (REST API)
│   ├── ReconciliationController - Réconciliation CBS
│   ├── TicketController - Gestion tickets
│   ├── UserController - Gestion utilisateurs
│   └── KpiController - Métriques et KPI
│
├── Services (Business Logic)
│   ├── ReconciliationService - Logique réconciliation
│   ├── TicketService - Workflow tickets
│   ├── WorkflowService - Camunda BPMN
│   └── RpaService - Intégration UiPath
│
├── Repositories (Data Access)
│   ├── InformixRepository - Accès CBS (JDBC)
│   └── JPA Repositories - MySQL (Tickets, Users, etc.)
│
└── Configuration
    ├── DataSourceConfig - Multi-datasource (MySQL + Informix)
    ├── SecurityConfig - JWT + LDAP
    └── CorsConfig - CORS policy
```

## Technologies

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Data JPA** - ORM pour MySQL
- **Spring JDBC** - Accès direct Informix
- **HikariCP** - Connection pooling
- **Camunda BPMN 7.20** - Workflow engine
- **JWT** - Authentification
- **LDAP** - Intégration Active Directory
- **Actuator** - Monitoring
- **Prometheus** - Métriques

## Prérequis

- Java 17 ou supérieur
- Maven 3.8+
- MySQL 8.0+
- Accès réseau au serveur Informix

## Installation

### 1. Cloner et Build

```bash
cd backend-java
mvn clean install
```

### 2. Configuration

Créer `.env` à la racine:

```bash
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bank_data_quality

# Informix CBS
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=your_informix_password

# Application
SERVER_PORT=8080
JWT_SECRET=your-secret-key-minimum-256-bits
```

### 3. Lancer l'Application

```bash
# Via Maven
mvn spring-boot:run

# Ou via JAR
mvn package
java -jar target/data-quality-backend-1.0.0.jar
```

L'application démarre sur http://localhost:8080

## API Endpoints

### Réconciliation CBS

```bash
# Tâches en attente
GET /api/reconciliation/pending?agencyCode=AG001

# Réconcilier une tâche
POST /api/reconciliation/{id}/reconcile

# Réconciliation en batch
POST /api/reconciliation/reconcile-all
Body: {"agency_code":"AG001","max_tasks":50}

# Statistiques
GET /api/reconciliation/stats?agencyCode=AG001

# Historique
GET /api/reconciliation/history?status=reconciled

# Health check
GET /api/reconciliation/health
```

### Tickets

```bash
# Liste des tickets
GET /api/tickets

# Créer un ticket
POST /api/tickets
Body: {"title":"...","description":"...","priority":"HIGH"}

# Détails d'un ticket
GET /api/tickets/{id}

# Mettre à jour
PUT /api/tickets/{id}

# Assigner
POST /api/tickets/{id}/assign
Body: {"userId":"user123"}

# Approuver
POST /api/tickets/{id}/approve

# Rejeter
POST /api/tickets/{id}/reject
Body: {"reason":"..."}
```

### KPI

```bash
# KPI du jour
GET /api/kpi/today

# KPI par période
GET /api/kpi/range?start=2025-01-01&end=2025-01-31

# Calculer les KPI
POST /api/kpi/calculate
```

### Monitoring

```bash
# Health check
GET /actuator/health

# Métriques
GET /actuator/metrics

# Prometheus
GET /actuator/prometheus

# Pool de connexions
GET /actuator/metrics/hikari.connections.active
```

## Connexion Multi-DataSource

### MySQL (Primary)

Pour les données applicatives:
- Users, Tickets, Anomalies, Corrections
- JPA/Hibernate
- Pool: 20 connexions max

```java
@Autowired
@Qualifier("primaryJdbcTemplate")
private JdbcTemplate mysqlJdbcTemplate;
```

### Informix (CBS)

Pour les données métier:
- Clients, Comptes, FATCA
- JDBC direct
- Pool: 10 connexions max

```java
@Autowired
private InformixRepository informixRepository;
```

## Exemples de Code

### Réconciliation Simple

```java
@Autowired
private ReconciliationService reconciliationService;

public void reconcile(String taskId) {
    Map<String, Object> result = reconciliationService.reconcileTask(taskId);
    System.out.println("Status: " + result.get("status"));
    System.out.println("Matched: " + result.get("matched_fields") + "/" + result.get("total_fields"));
}
```

### Lire Client du CBS

```java
@Autowired
private InformixRepository informixRepository;

public void getClient(String clientId) {
    Map<String, Object> client = informixRepository.getClientById(clientId);
    System.out.println("Nom: " + client.get("name"));
    System.out.println("Email: " + client.get("email"));
}
```

### Recherche Clients

```java
List<Map<String, Object>> clients = informixRepository.searchClients("DUPONT", 100);
for (Map<String, Object> client : clients) {
    System.out.println(client.get("client_id") + " - " + client.get("name"));
}
```

### Mise à Jour CBS

```java
Map<String, Object> updates = new HashMap<>();
updates.put("adr", "123 Nouvelle Adresse");
updates.put("tel", "0123456789");

boolean success = informixRepository.updateClient("CLI123456", updates);
```

## Configuration JDBC Informix

URL JDBC:
```
jdbc:informix-sqli://HOST:PORT/DATABASE:INFORMIXSERVER=SERVER;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

Paramètres importants:
- `INFORMIXSERVER`: Nom du serveur (requis)
- `DELIMIDENT=Y`: Identifiants délimités
- `DB_LOCALE`: Encodage base
- `CLIENT_LOCALE`: Encodage client

## Tests

```bash
# Tous les tests
mvn test

# Tests spécifiques
mvn test -Dtest=InformixRepositoryTest
mvn test -Dtest=ReconciliationServiceTest

# Avec rapport de couverture
mvn test jacoco:report
```

## Logs

Les logs sont stockés dans `logs/application.log`:

```
2025-01-04 10:00:00 - Starting DataQualityBackendApplication
2025-01-04 10:00:01 - HikariPool-1 - Starting MySQLPool
2025-01-04 10:00:02 - HikariPool-2 - Starting InformixPool
2025-01-04 10:00:03 - Tomcat started on port 8080
2025-01-04 10:00:10 - Reconciliation completed: 8/10 fields matched
```

Niveaux de log:
```yaml
logging.level:
  root: INFO
  com.bsic: DEBUG
  com.zaxxer.hikari: DEBUG
  org.springframework.jdbc: DEBUG
```

## Performance

### Pool de Connexions

HikariCP avec configuration optimale:

**MySQL (Primary):**
- Max pool size: 20
- Min idle: 5
- Connection timeout: 30s

**Informix (CBS):**
- Max pool size: 10
- Min idle: 2
- Connection timeout: 30s

### Métriques Prometheus

Activer dans `application.yml`:
```yaml
management:
  endpoints.web.exposure.include: health,metrics,prometheus
  metrics.export.prometheus.enabled: true
```

Accéder à:
```
http://localhost:8080/actuator/prometheus
```

## Sécurité

### JWT

Tokens JWT avec expiration 24h:

```java
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    String token = jwtService.generateToken(user);
    return ResponseEntity.ok(new LoginResponse(token));
}
```

### LDAP

Intégration Active Directory:

```yaml
spring.ldap:
  urls: ldap://domain-controller.com
  base: dc=bsic,dc=local
  username: cn=admin,dc=bsic,dc=local
  password: ${LDAP_PASSWORD}
```

### Roles

- `ROLE_ADMIN`: Administration complète
- `ROLE_AUDITOR`: Lecture + validation
- `ROLE_AGENCY_USER`: Agence spécifique

```java
@PreAuthorize("hasRole('ADMIN')")
public void adminOnly() { }

@PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
public void adminOrAuditor() { }
```

## Déploiement

### JAR Standalone

```bash
mvn clean package -DskipTests
java -jar target/data-quality-backend-1.0.0.jar
```

### Docker

```bash
docker build -t bsic-backend .
docker run -p 8080:8080 \
  -e INFORMIX_HOST=10.3.0.66 \
  -e INFORMIX_PASSWORD=secret \
  bsic-backend
```

### Systemd

```bash
sudo cp backend.service /etc/systemd/system/
sudo systemctl enable backend
sudo systemctl start backend
```

## Workflow Camunda

BPMN pour le workflow de tickets:

1. Création ticket
2. Validation 4 yeux
3. Approbation
4. Déclenchement RPA
5. Réconciliation CBS
6. Clôture

Accéder à Camunda:
```
http://localhost:8080/camunda
User: admin
Pass: admin
```

## Dépannage

### Erreur "No suitable driver"

```bash
mvn dependency:purge-local-repository -DmanualInclude=com.ibm.informix:jdbc
mvn clean install
```

### Connection refused Informix

```bash
telnet 10.3.0.66 1526
ping 10.3.0.66
```

### Pool exhausted

Augmenter le pool size:
```yaml
spring.datasource.informix.hikari.maximum-pool-size: 20
```

## Documentation

- [JDBC Informix Setup Guide](../JDBC_INFORMIX_SETUP.md)
- [CBS Reconciliation Architecture](../CBS_RECONCILIATION_ARCHITECTURE.md)
- [Camunda Workflow Guide](../CAMUNDA_WORKFLOW_GUIDE.md)

## Support

En cas de problème:
1. Vérifier les logs `logs/application.log`
2. Tester la connexion Informix
3. Vérifier les variables d'environnement
4. Consulter la documentation

Contact: support@bsic.com
