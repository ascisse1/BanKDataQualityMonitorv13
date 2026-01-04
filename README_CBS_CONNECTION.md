# Guide de Connexion au Core Banking System (CBS)

## Deux Solutions Disponibles

L'application offre deux approches pour se connecter au Core Banking System Informix:

### 1. Node.js + ODBC (Legacy)
Configuration via DSN ODBC système - Nécessite installation de drivers OS

### 2. Spring Boot + JDBC (Recommandé)
Configuration via JDBC natif Java - Cross-platform, plus stable

## Comparaison Rapide

| Critère | Node.js + ODBC | Spring Boot + JDBC |
|---------|----------------|-------------------|
| **Installation** | Complexe (DSN Windows) | Simple (Maven) |
| **Configuration** | Registre Windows | Fichier .env |
| **Stabilité** | Moyenne | Excellente |
| **Performance** | Bonne | Optimale |
| **Portabilité** | OS-dépendant | 100% cross-platform |
| **Déploiement** | Multi-étapes | Un JAR |
| **Monitoring** | Limité | Actuator + Prometheus |
| **Recommandation** | ⚠️ Legacy | ✅ Production |

---

## Solution 1: Node.js + ODBC

### Prérequis
- Windows avec ODBC Data Source Administrator
- IBM Informix Client SDK
- Configuration DSN système

### Configuration

1. **Installer Informix Client SDK**
   ```
   Télécharger depuis: IBM Informix Downloads
   Installer: C:\Program Files\IBM\Informix Client SDK
   ```

2. **Configurer DSN ODBC**
   ```
   Panneau de configuration > ODBC Data Sources (64-bit)
   DSN Système > Ajouter > IBM INFORMIX ODBC DRIVER

   Data Source Name: lcb
   Server Name: ol_bdmsa
   Host Name: 10.3.0.66
   Port: 1526
   Database: bdmsa
   User: bank
   ```

3. **Variables d'environnement (.env)**
   ```bash
   INFORMIX_DSN=lcb
   INFORMIX_USER=bank
   INFORMIX_PASSWORD=your_password
   ```

4. **Démarrer**
   ```bash
   npm install
   npm run server
   ```

### Endpoints Node.js
```
http://localhost:3001/api/anomalies/individual
http://localhost:3001/api/fatca/clients
http://localhost:3001/api/stats/clients
```

### Documentation
- [INFORMIX_SETUP.md](INFORMIX_SETUP.md) - Installation complète
- [DSN_CONNECTION_GUIDE.md](DSN_CONNECTION_GUIDE.md) - Configuration DSN
- [TROUBLESHOOTING_INFORMIX.md](TROUBLESHOOTING_INFORMIX.md) - Dépannage

---

## Solution 2: Spring Boot + JDBC (Recommandé)

### Prérequis
- Java 17 minimum
- Maven 3.8+
- Aucune configuration OS requise

### Installation en 5 Minutes

1. **Configuration (.env)**
   ```bash
   # Informix CBS
   INFORMIX_HOST=10.3.0.66
   INFORMIX_PORT=1526
   INFORMIX_DATABASE=bdmsa
   INFORMIX_SERVER=ol_bdmsa
   INFORMIX_USER=bank
   INFORMIX_PASSWORD=your_password

   # MySQL (Application)
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=bank_data_quality
   ```

2. **Build et Test**
   ```bash
   cd backend-java
   mvn clean install
   ./test-jdbc-connection.sh
   ```

3. **Démarrer**
   ```bash
   mvn spring-boot:run
   ```

   Ou:
   ```bash
   java -jar target/data-quality-backend-1.0.0.jar
   ```

### Endpoints Spring Boot
```
http://localhost:8080/api/reconciliation/pending
http://localhost:8080/api/reconciliation/stats
http://localhost:8080/actuator/health
http://localhost:8080/actuator/prometheus
```

### Architecture JDBC

```
Spring Boot (Port 8080)
├── DataSourceConfig
│   ├── MySQL DataSource (Primary) - Pool 20
│   └── Informix DataSource (CBS) - Pool 10
│
├── InformixRepository
│   ├── getClientById()
│   ├── searchClients()
│   ├── updateClient()
│   └── executeCustomQuery()
│
└── ReconciliationService
    ├── reconcileTask()
    ├── reconcileAll()
    └── getStats()
```

### Avantages JDBC

#### 1. Installation Simplifiée
- Pas de configuration OS
- Maven télécharge tout
- Un seul fichier .env

#### 2. Portabilité
- Fonctionne sur Windows, Linux, Mac
- Un seul JAR exécutable
- Docker-ready

#### 3. Performance
- HikariCP: Pool ultra-rapide
- Connection pooling optimisé
- Transactions Spring natives

#### 4. Monitoring
- Spring Actuator intégré
- Métriques Prometheus
- Health checks automatiques
- JMX pour production

#### 5. Maintenance
- Code Java structuré
- Tests unitaires faciles
- Logs détaillés SLF4J
- Standards Spring Boot

### Documentation JDBC
- [CONNEXION_JDBC_CBS.md](CONNEXION_JDBC_CBS.md) - Guide complet
- [JDBC_INFORMIX_SETUP.md](JDBC_INFORMIX_SETUP.md) - Installation détaillée
- [backend-java/README.md](backend-java/README.md) - Documentation backend
- [backend-java/QUICK_START.md](backend-java/QUICK_START.md) - Démarrage rapide

---

## Architecture Hybride Complète

```
┌─────────────────────────────────────────────────────────┐
│           Frontend React (Port 5173)                    │
│           Interface utilisateur                         │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌───────────────────┐   ┌──────────────────────┐
│  Node.js Backend  │   │ Spring Boot Backend  │
│  (Port 3001)      │   │  (Port 8080)         │
│                   │   │                      │
│  • ODBC Informix  │   │  • JDBC Informix    │
│  • Legacy APIs    │   │  • Réconciliation   │
│  • FATCA/Anomalies│   │  • Monitoring       │
└─────────┬─────────┘   └──────────┬───────────┘
          │                        │
          └────────┬───────────────┘
                   │
          ┌────────┴─────────┐
          │                  │
          ↓                  ↓
   ┌──────────────┐   ┌─────────────────┐
   │ MySQL Server │   │ Informix Server │
   │ Port 3306    │   │ Port 1526       │
   │              │   │ (Core Banking)  │
   └──────────────┘   └─────────────────┘
```

---

## Processus de Réconciliation

### Workflow Complet

```
1. DÉTECTION D'ANOMALIES
   ├─ Frontend → Lecture CBS (via Node.js ou Spring)
   ├─ Application règles de validation
   ├─ Détection anomalies
   └─ Stockage MySQL

2. CORRECTION UTILISATEUR
   ├─ Utilisateur agence consulte anomalies
   ├─ Propose corrections
   ├─ Validation "4 yeux"
   └─ Approbation ticket

3. APPLICATION AU CBS (RPA)
   ├─ RPA UiPath déclenché
   ├─ Application corrections dans CBS
   └─ Mise à jour Informix

4. RÉCONCILIATION (VÉRIFICATION)
   ├─ Spring Boot lit données CBS (JDBC)
   ├─ Compare avec corrections attendues
   ├─ Calcule écarts
   └─ Met à jour statut dans MySQL
```

### Exemple de Réconciliation

**Ticket TKT-001:**
```json
{
  "client_id": "CLI123456",
  "corrections": [
    {
      "field": "address",
      "expected": "123 rue de Paris 75001",
      "cbs_actual": "123 rue de Paris 75001",
      "match": true ✅
    },
    {
      "field": "phone",
      "expected": "0123456789",
      "cbs_actual": "0123456789",
      "match": true ✅
    },
    {
      "field": "email",
      "expected": "client@example.com",
      "cbs_actual": "client@example.fr",
      "match": false ❌
    }
  ],
  "status": "partial",
  "matched": 2,
  "total": 3
}
```

---

## Quelle Solution Choisir ?

### Utilisez Node.js + ODBC si:
- Vous avez déjà une installation ODBC fonctionnelle
- Vous êtes uniquement sur Windows
- Vous ne faites que de la lecture de données
- C'est pour du développement/test uniquement

### Utilisez Spring Boot + JDBC si:
- **Vous déployez en production** ✅
- Vous avez besoin de stabilité
- Vous voulez du monitoring avancé
- Vous travaillez en équipe
- Vous voulez du cross-platform
- **Vous faites de la réconciliation** ✅

---

## Migration ODBC vers JDBC

Si vous utilisez actuellement ODBC et souhaitez migrer vers JDBC:

### Étape 1: Installation Parallèle

```bash
# Garder Node.js actif sur port 3001
npm run server

# Démarrer Spring Boot sur port 8080
cd backend-java
mvn spring-boot:run
```

### Étape 2: Tester JDBC

```bash
# Tester la connexion
cd backend-java
./test-jdbc-connection.sh

# Vérifier les APIs
curl http://localhost:8080/api/reconciliation/health
curl http://localhost:8080/api/reconciliation/stats
```

### Étape 3: Basculer le Frontend

Dans `src/services/apiService.ts`:

```typescript
// Avant (ODBC)
const API_URL = 'http://localhost:3001/api';

// Après (JDBC)
const API_URL = 'http://localhost:8080/api';
```

### Étape 4: Arrêter ODBC

Une fois validé, arrêter le serveur Node.js et utiliser uniquement Spring Boot.

---

## Configuration Multi-Environnement

### Développement

**.env.development:**
```bash
# Node.js
PORT=3001

# Spring Boot
SERVER_PORT=8080

# Informix (local ou test)
INFORMIX_HOST=localhost
INFORMIX_PORT=1526
```

### Production

**.env.production:**
```bash
# Spring Boot uniquement
SERVER_PORT=8080

# Informix production
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa

# Sécurité renforcée
INFORMIX_USER=${VAULT_INFORMIX_USER}
INFORMIX_PASSWORD=${VAULT_INFORMIX_PASSWORD}
```

---

## Monitoring Production

### Spring Boot + JDBC

```bash
# Health check
curl http://prod-server:8080/actuator/health

# Métriques
curl http://prod-server:8080/actuator/metrics

# Prometheus
curl http://prod-server:8080/actuator/prometheus

# Pool de connexions
curl http://prod-server:8080/actuator/metrics/hikari.connections.active
```

### Grafana Dashboard

Importer le dashboard pour visualiser:
- Connexions actives/idle
- Temps de réponse CBS
- Taux de succès réconciliation
- Erreurs et timeouts

---

## Dépannage Rapide

### ODBC: "Error -23101"
```bash
# Vérifier DSN
powershell .\scripts\test-dsn-connection.js

# Voir: INFORMIX_ERROR_23101.md
```

### JDBC: "No suitable driver"
```bash
cd backend-java
mvn dependency:purge-local-repository -DmanualInclude=com.ibm.informix:jdbc
mvn clean install
```

### CBS Non Accessible
```bash
# Tester réseau
ping 10.3.0.66
telnet 10.3.0.66 1526

# Vérifier firewall
netstat -an | findstr 1526
```

---

## Documentation Complète

### Node.js + ODBC
- [INFORMIX_SETUP.md](INFORMIX_SETUP.md)
- [DSN_CONNECTION_GUIDE.md](DSN_CONNECTION_GUIDE.md)
- [INFORMIX_ERROR_23101.md](INFORMIX_ERROR_23101.md)
- [TROUBLESHOOTING_INFORMIX.md](TROUBLESHOOTING_INFORMIX.md)

### Spring Boot + JDBC
- [CONNEXION_JDBC_CBS.md](CONNEXION_JDBC_CBS.md)
- [JDBC_INFORMIX_SETUP.md](JDBC_INFORMIX_SETUP.md)
- [backend-java/README.md](backend-java/README.md)
- [backend-java/QUICK_START.md](backend-java/QUICK_START.md)

### Architecture
- [CBS_RECONCILIATION_ARCHITECTURE.md](CBS_RECONCILIATION_ARCHITECTURE.md)
- [ARCHITECTURE_HYBRIDE.md](ARCHITECTURE_HYBRIDE.md)
- [RECONCILIATION_SETUP_GUIDE.md](RECONCILIATION_SETUP_GUIDE.md)

---

## Support et Contact

Pour toute question ou problème:

1. Consulter la documentation appropriée
2. Vérifier les logs (`logs/application.log`)
3. Tester la connexion avec les scripts fournis
4. Activer le mode DEBUG si nécessaire

**Recommandation finale:** Utilisez Spring Boot + JDBC pour la production. C'est plus stable, plus performant, et plus facile à maintenir.
