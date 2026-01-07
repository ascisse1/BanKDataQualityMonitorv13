# Connexion JDBC au Core Banking System (CBS)

## Vue d'ensemble

Solution complète de connexion JDBC Java pour se connecter au Core Banking System Informix et effectuer la réconciliation des données.

## Pourquoi JDBC plutôt qu'ODBC ?

| Critère | JDBC (Java) | ODBC (Node.js) |
|---------|-------------|----------------|
| **Installation** | Simple (Maven auto) | Complexe (DSN + drivers OS) |
| **Portabilité** | 100% cross-platform | Dépend de l'OS |
| **Stabilité** | Excellente | Moyenne |
| **Performance** | Optimale (HikariCP) | Bonne |
| **Configuration** | Fichier .env + YAML | DSN système |
| **Déploiement** | Un seul JAR | Multi-étapes |
| **Monitoring** | Actuator + Prometheus | Limité |
| **Transactions** | Spring @Transactional | Manuel |
| **Maintenance** | Facile | Difficile |

## Architecture Complète

```
┌────────────────────────────────────────────────────────────────┐
│                  Frontend React (Port 5173)                    │
│                   Interface utilisateur                        │
└──────────────────────┬─────────────────────────────────────────┘
                       │ HTTP REST API
                       ↓
┌────────────────────────────────────────────────────────────────┐
│          Backend Spring Boot (Port 8080)                       │
│                                                                │
│  ┌──────────────────┐         ┌──────────────────────┐       │
│  │ ReconciliationCtrl│        │ ReconciliationService│       │
│  └────────┬──────────┘         └─────────┬────────────┘       │
│           │                              │                    │
│           └──────────────┬───────────────┘                    │
│                          ↓                                    │
│           ┌─────────────────────────────┐                    │
│           │  Multi-DataSource Config    │                    │
│           └──────┬──────────────┬───────┘                    │
│                  │              │                            │
│        ┌─────────┴───┐    ┌────┴──────────┐                │
│        │ MySQL JDBC  │    │ Informix JDBC │                │
│        │ JdbcTemplate│    │ JdbcTemplate  │                │
│        │ (Primary)   │    │ (CBS)         │                │
│        │ Pool: 20    │    │ Pool: 10      │                │
│        └──────┬──────┘    └──────┬────────┘                │
└───────────────┼──────────────────┼──────────────────────────┘
                │                  │
                ↓                  ↓
       ┌────────────────┐  ┌──────────────────┐
       │  MySQL Server  │  │ Informix Server  │
       │  Port 3306     │  │  Port 1526       │
       │                │  │  (Core Banking)  │
       │  • Users       │  │  • bkcli (Clients)│
       │  • Tickets     │  │  • Transactions  │
       │  • Anomalies   │  │  • FATCA         │
       │  • Corrections │  │  • Comptes       │
       └────────────────┘  └──────────────────┘
```

## Installation Rapide

### 1. Prérequis

```bash
# Java 17 minimum
java -version

# Maven 3.8+
mvn -version
```

### 2. Configuration

Fichier `.env` à la racine:

```bash
# MySQL (Application)
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

# Spring Boot
SERVER_PORT=8080
JWT_SECRET=your-secret-key-minimum-256-bits
```

### 3. Build et Test

```bash
cd backend-java

# Build
mvn clean install

# Test connexion JDBC
./test-jdbc-connection.sh

# Démarrer
mvn spring-boot:run
```

### 4. Vérification

```bash
# Health check
curl http://localhost:8080/api/reconciliation/health

# Réponse attendue:
{
  "status": "UP",
  "service": "Reconciliation Service",
  "timestamp": "2025-01-04T10:00:00"
}
```

## Configuration JDBC Détaillée

### URL JDBC Informix

Format complet:
```
jdbc:informix-sqli://HOST:PORT/DATABASE:INFORMIXSERVER=SERVER_NAME;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

Exemple:
```
jdbc:informix-sqli://10.3.0.66:1526/bdmsa:INFORMIXSERVER=ol_bdmsa;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

### Paramètres Importants

| Paramètre | Description | Valeur Recommandée |
|-----------|-------------|-------------------|
| `INFORMIXSERVER` | Nom du serveur (requis) | `ol_bdmsa` |
| `DELIMIDENT` | Identifiants délimités | `Y` |
| `DB_LOCALE` | Encodage base de données | `en_US.utf8` |
| `CLIENT_LOCALE` | Encodage client | `en_US.utf8` |
| `OPTOFC` | Optimisation curseurs | `1` |
| `OPTCOMPIND` | Optimisation compilation | `2` |

### Pool de Connexions HikariCP

Configuration optimale dans `DataSourceConfig.java`:

```java
HikariConfig config = new HikariConfig();

// Pool Informix (CBS)
config.setMaximumPoolSize(10);        // Max 10 connexions
config.setMinimumIdle(2);             // Min 2 en idle
config.setConnectionTimeout(30000);    // 30s timeout
config.setIdleTimeout(300000);        // 5min idle timeout
config.setMaxLifetime(1800000);       // 30min max lifetime
config.setConnectionTestQuery("SELECT FIRST 1 1 FROM systables");
```

## API de Réconciliation

### Endpoints REST

#### 1. Tâches en Attente
```bash
GET /api/reconciliation/pending?agencyCode=AG001&clientId=CLI123

# Réponse:
[
  {
    "id": "uuid",
    "ticket_id": "TKT-001",
    "client_id": "CLI123456",
    "client_name": "DUPONT Jean",
    "status": "pending",
    "corrections": [
      {
        "field_name": "address",
        "field_label": "Adresse",
        "expected_value": "123 rue de Paris",
        "cbs_value": null,
        "is_matched": false
      }
    ]
  }
]
```

#### 2. Réconcilier une Tâche
```bash
POST /api/reconciliation/{taskId}/reconcile

# Réponse:
{
  "task_id": "uuid",
  "status": "success",
  "matched_fields": 8,
  "total_fields": 10,
  "discrepancies": [
    {
      "field": "address",
      "field_label": "Adresse",
      "expected_value": "123 rue de Paris",
      "actual_value": "123 rue de Pari",
      "severity": "medium"
    }
  ],
  "checked_at": "2025-01-04T10:00:00"
}
```

#### 3. Réconciliation en Batch
```bash
POST /api/reconciliation/reconcile-all
Content-Type: application/json

{
  "agency_code": "AG001",
  "max_tasks": 50
}

# Réponse:
{
  "success": 45,
  "failed": 3,
  "total": 48
}
```

#### 4. Statistiques
```bash
GET /api/reconciliation/stats?agencyCode=AG001

# Réponse:
{
  "total_pending": 25,
  "reconciled_today": 150,
  "failed_today": 5,
  "success_rate": 96.77,
  "average_reconciliation_time": 2.3,
  "by_status": [
    {"status": "pending", "count": 25},
    {"status": "reconciled", "count": 450},
    {"status": "failed", "count": 15},
    {"status": "partial", "count": 10}
  ]
}
```

## Utilisation du Code

### Java - Réconciliation Simple

```java
@Autowired
private ReconciliationService reconciliationService;

public void reconcile(String taskId) {
    Map<String, Object> result = reconciliationService.reconcileTask(taskId);

    System.out.println("Status: " + result.get("status"));
    System.out.println("Matched: " + result.get("matched_fields") +
                       "/" + result.get("total_fields"));

    List<Map<String, Object>> discrepancies =
        (List) result.get("discrepancies");

    for (Map<String, Object> disc : discrepancies) {
        System.out.println("Field: " + disc.get("field"));
        System.out.println("Expected: " + disc.get("expected_value"));
        System.out.println("Actual: " + disc.get("actual_value"));
        System.out.println("---");
    }
}
```

### Java - Accès Direct CBS

```java
@Autowired
private InformixRepository informixRepository;

// Lire un client
public Map<String, Object> getClient(String clientId) {
    return informixRepository.getClientById(clientId);
}

// Rechercher des clients
public List<Map<String, Object>> searchClients(String name) {
    return informixRepository.searchClients(name, 100);
}

// Mettre à jour un client
public void updateClient(String clientId, String newAddress) {
    Map<String, Object> updates = new HashMap<>();
    updates.put("adr", newAddress);
    updates.put("dma", LocalDate.now());

    informixRepository.updateClient(clientId, updates);
}

// Query personnalisée
public List<Map<String, Object>> customQuery() {
    String sql = """
        SELECT FIRST 100
            cli, nom, pre, adr
        FROM bkcli
        WHERE age = ?
        ORDER BY nom
    """;

    return informixRepository.executeCustomQueryList(sql, "AG001");
}
```

### TypeScript/React - Appel API

```typescript
// Service API
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const reconciliationService = {
  async getPendingTasks(agencyCode?: string) {
    const response = await axios.get(`${API_URL}/reconciliation/pending`, {
      params: { agencyCode },
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  async reconcileTask(taskId: string) {
    const response = await axios.post(
      `${API_URL}/reconciliation/${taskId}/reconcile`,
      {},
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  async reconcileAll(agencyCode: string, maxTasks: number = 50) {
    const response = await axios.post(
      `${API_URL}/reconciliation/reconcile-all`,
      { agency_code: agencyCode, max_tasks: maxTasks },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  async getStats(agencyCode?: string) {
    const response = await axios.get(`${API_URL}/reconciliation/stats`, {
      params: { agencyCode },
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  }
};
```

## Monitoring et Métriques

### Actuator Endpoints

```bash
# Health check global
curl http://localhost:8080/actuator/health

# Métriques détaillées
curl http://localhost:8080/actuator/metrics

# Pool de connexions Informix
curl http://localhost:8080/actuator/metrics/hikari.connections.active
curl http://localhost:8080/actuator/metrics/hikari.connections.idle

# Métriques Prometheus
curl http://localhost:8080/actuator/prometheus
```

### Logs

Les logs sont écrits dans `logs/application.log`:

```
2025-01-04 10:00:00 - Starting DataQualityBackendApplication
2025-01-04 10:00:01 - HikariPool-1 - Starting MySQLPool
2025-01-04 10:00:02 - HikariPool-2 - Starting InformixPool
2025-01-04 10:00:03 - Tomcat started on port 8080
2025-01-04 10:05:12 - Starting reconciliation for task: abc123
2025-01-04 10:05:13 - Fetching client CLI123456 from CBS
2025-01-04 10:05:14 - Reconciliation completed: 8/10 fields matched
```

Activer le mode DEBUG:
```bash
java -jar target/data-quality-backend-1.0.0.jar \
  --logging.level.com.bsic=DEBUG \
  --logging.level.com.zaxxer.hikari=DEBUG
```

## Avantages de la Solution JDBC

### 1. Simplicité

- Configuration en 5 minutes
- Un seul fichier `.env`
- Maven télécharge tout automatiquement
- Pas de configuration OS

### 2. Performance

- HikariCP: Pool le plus rapide
- Connection pooling optimisé
- Gestion mémoire efficace
- Transactions natives Spring

### 3. Stabilité

- Driver JDBC mature et stable
- Reconnexion automatique
- Gestion d'erreurs robuste
- Logs détaillés

### 4. Portabilité

- 100% cross-platform
- Un seul JAR exécutable
- Aucune dépendance OS
- Docker-ready

### 5. Monitoring

- Actuator intégré
- Métriques Prometheus
- Health checks
- JMX pour production

### 6. Maintenance

- Code Java structuré
- Tests unitaires faciles
- Documentation complète
- Standards Spring Boot

## Dépannage

### Erreur: "No suitable driver found"

```bash
# Re-télécharger le driver Informix
mvn dependency:purge-local-repository -DmanualInclude=com.ibm.informix:jdbc
mvn clean install
```

### Erreur: "Connection refused"

```bash
# Tester la connectivité
telnet 10.3.0.66 1526
ping 10.3.0.66

# Vérifier les paramètres dans .env
cat .env | grep INFORMIX
```

### Erreur: "SQL Error -951"

Ajouter dans l'URL JDBC:
```
;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8
```

### Pool Exhausted

Augmenter la taille du pool:
```yaml
spring.datasource.informix.hikari.maximum-pool-size: 20
```

## Documentation Complète

| Document | Description |
|----------|-------------|
| [JDBC_INFORMIX_SETUP.md](JDBC_INFORMIX_SETUP.md) | Guide complet installation JDBC |
| [backend-java/README.md](backend-java/README.md) | Documentation backend Spring Boot |
| [backend-java/QUICK_START.md](backend-java/QUICK_START.md) | Démarrage rapide 5 minutes |
| [CBS_RECONCILIATION_ARCHITECTURE.md](CBS_RECONCILIATION_ARCHITECTURE.md) | Architecture complète réconciliation |

## Démarrage Immédiat

```bash
# 1. Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# 2. Build
cd backend-java
mvn clean install

# 3. Test
./test-jdbc-connection.sh

# 4. Démarrer
mvn spring-boot:run

# 5. Tester
curl http://localhost:8080/api/reconciliation/health
```

## Support

En cas de problème:

1. Vérifier les logs: `logs/application.log`
2. Tester la connexion: `./test-jdbc-connection.sh`
3. Vérifier la configuration: `.env`
4. Consulter la documentation complète
5. Activer le mode DEBUG

Contact: support@bsic.com
