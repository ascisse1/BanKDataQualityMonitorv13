# 🚀 Démarrage Connexion JDBC CBS

## ✅ Configuration Complète Terminée

L'intégration JDBC Informix est maintenant prête. Suivez ces étapes pour activer la réconciliation CBS.

---

## 📋 Prérequis

- [x] Java 17+ installé
- [x] Maven 3.8+ installé
- [x] MySQL 8.0+ configuré
- [x] Accès réseau Informix CBS (10.3.0.66:1526)

---

## 🎯 Activation en 5 Étapes

### Étape 1: Configuration Environnement

Copier et configurer `.env`:

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres:

```bash
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
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
VITE_SPRING_BOOT_URL=http://localhost:8080
```

### Étape 2: Tables de Réconciliation

```bash
npm run db:reconciliation
```

Cela crée:
- `reconciliation_tasks` - Tâches de réconciliation
- `reconciliation_audit` - Historique
- `reconciliation_stats` - Vue statistiques
- Colonnes CBS dans `corrections`

### Étape 3: Build Backend Java

```bash
cd backend-java
mvn clean install
```

Tester la connexion JDBC:

```bash
./test-jdbc-connection.sh
```

Résultat attendu:
```
✅ Driver JDBC Informix chargé
✅ Connexion établie
✅ Requête test réussie
✅ Nombre de clients dans CBS: XXX
```

### Étape 4: Démarrer Backend Spring Boot

Terminal 1:
```bash
cd backend-java
mvn spring-boot:run
```

Backend démarre sur: http://localhost:8080

Vérifier:
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

### Étape 5: Démarrer Frontend

Terminal 2:
```bash
npm run dev
```

Frontend démarre sur: http://localhost:5173

---

## 🎨 Accès Dashboard Réconciliation

Ouvrir: **http://localhost:5173/reconciliation/dashboard**

Vous verrez:

### Statistiques Temps Réel
- 📊 Tâches en attente
- ✅ Réconciliées aujourd'hui
- ❌ Échouées aujourd'hui
- 📈 Taux de succès
- ⏱️ Temps moyen

### Actions Disponibles
- **Réconcilier une tâche** - Vérifier une tâche spécifique
- **Réconcilier tout** - Traiter toutes les tâches en attente
- **Filtres** - Par statut (pending/reconciled/failed)
- **Actualiser** - Rafraîchir les données

---

## 🧪 Test End-to-End

### 1. Créer une Anomalie (Frontend)

```
Page Anomalies > Détecter Anomalies
Client CLI123456 a anomalies
```

### 2. Créer un Ticket avec Corrections

```sql
-- Simuler un ticket approuvé avec corrections
INSERT INTO tickets (ticket_number, anomaly_id, status, approval_status)
VALUES ('TKT-001', 1, 'approved', 'approved');

INSERT INTO corrections (ticket_id, field_name, field_label, old_value, new_value)
VALUES
  ('TKT-001', 'address', 'Adresse', '123 rue ancien', '456 rue nouveau'),
  ('TKT-001', 'phone', 'Téléphone', '0111111111', '0123456789');
```

### 3. Créer Tâche de Réconciliation

```sql
INSERT INTO reconciliation_tasks (ticket_id, client_id, status)
VALUES ('TKT-001', 'CLI123456', 'pending');
```

### 4. Lancer Réconciliation

Aller sur: http://localhost:5173/reconciliation/dashboard

Cliquer sur **"Réconcilier"** pour la tâche TKT-001

### 5. Vérifier Résultat

Le système va:
1. Lire données CBS via JDBC
2. Comparer avec corrections attendues
3. Calculer écarts (discrepancies)
4. Mettre à jour statut

Résultats possibles:
- ✅ **Reconciled** - Tous les champs correspondent
- ⚠️ **Partial** - Certains champs ne correspondent pas
- ❌ **Failed** - Erreur de connexion ou données manquantes

---

## 📊 Monitoring Production

### Métriques Actuator

```bash
# Health check
curl http://localhost:8080/actuator/health

# Pool connexions
curl http://localhost:8080/actuator/metrics/hikari.connections.active

# Prometheus (pour Grafana)
curl http://localhost:8080/actuator/prometheus
```

### Logs Détaillés

```bash
# Suivre en temps réel
tail -f backend-java/logs/application.log

# Mode DEBUG
cd backend-java
java -jar target/data-quality-backend-1.0.0.jar --logging.level.com.bsic=DEBUG
```

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────┐
│ 1. DÉTECTION ANOMALIE                       │
│    Frontend détecte anomalies dans CBS      │
│    Stocke dans MySQL                        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 2. CRÉATION TICKET                          │
│    Utilisateur agence propose corrections   │
│    Stocke dans tickets + corrections        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 3. VALIDATION 4 YEUX                        │
│    Superviseur approuve corrections         │
│    Déclenche RPA UiPath                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 4. APPLICATION CBS                          │
│    RPA applique corrections dans Informix   │
│    Mise à jour données CBS                  │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 5. RÉCONCILIATION (NOUVEAU!)                │
│    Spring Boot lit CBS via JDBC             │
│    Compare avec corrections attendues       │
│    Calcule écarts (discrepancies)           │
│    Statut: reconciled/partial/failed        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 6. REPORTING                                │
│    Dashboard affiche résultats              │
│    Statistiques succès/échec                │
│    Alertes si discrepancies                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Commandes Rapides

```bash
# Setup complet
npm run db:reconciliation
cd backend-java && mvn clean install && ./test-jdbc-connection.sh

# Démarrer (2 terminaux)
# Terminal 1:
cd backend-java && mvn spring-boot:run

# Terminal 2:
npm run dev

# Tester
curl http://localhost:8080/api/reconciliation/health
open http://localhost:5173/reconciliation/dashboard
```

---

## 🐛 Dépannage Rapide

### Backend ne démarre pas

```bash
# Vérifier Java
java -version  # doit être >= 17

# Re-build
cd backend-java
mvn clean install
```

### Erreur connexion Informix

```bash
# Tester réseau
telnet 10.3.0.66 1526
ping 10.3.0.66

# Vérifier .env
cat .env | grep INFORMIX

# Logs détaillés
cd backend-java
./test-jdbc-connection.sh
```

### Frontend ne trouve pas le backend

```bash
# Vérifier VITE_SPRING_BOOT_URL dans .env
echo $VITE_SPRING_BOOT_URL  # doit être http://localhost:8080

# Vérifier que Spring Boot est démarré
curl http://localhost:8080/actuator/health
```

### Erreur CORS

Le backend est configuré pour accepter:
- http://localhost:5173 (Vite dev)
- http://localhost:3000 (alternative)

Si autre port, modifier `application.yml`:
```yaml
app.cors.allowed-origins: http://localhost:YOUR_PORT
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [NEXT_STEPS.md](NEXT_STEPS.md) | Guide d'activation détaillé |
| [CONNEXION_JDBC_CBS.md](CONNEXION_JDBC_CBS.md) | Guide complet JDBC |
| [JDBC_INFORMIX_SETUP.md](JDBC_INFORMIX_SETUP.md) | Setup technique |
| [backend-java/README.md](backend-java/README.md) | Backend Spring Boot |
| [backend-java/QUICK_START.md](backend-java/QUICK_START.md) | Quick start 5 min |
| [README_CBS_CONNECTION.md](README_CBS_CONNECTION.md) | ODBC vs JDBC |

---

## ✨ Résultat Final

Vous aurez:

✅ Backend Spring Boot connecté à Informix via JDBC
✅ Pool de connexions optimisé HikariCP
✅ API REST de réconciliation CBS
✅ Dashboard React temps réel
✅ Réconciliation automatique CBS ↔ MySQL
✅ Monitoring Actuator + Prometheus
✅ Audit trail complet
✅ Alertes sur discrepancies

---

## 🚀 GO!

```bash
# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Setup
npm run db:reconciliation
cd backend-java && mvn clean install

# Test
./test-jdbc-connection.sh

# Démarrer backend
mvn spring-boot:run

# Démarrer frontend (nouveau terminal)
npm run dev

# Accéder
open http://localhost:5173/reconciliation/dashboard

# 🎉 Profit!
```

---

**Support**: En cas de problème, consulter [NEXT_STEPS.md](NEXT_STEPS.md) pour le guide détaillé.
