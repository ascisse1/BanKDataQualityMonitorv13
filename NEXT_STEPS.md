# Prochaines Étapes - Intégration JDBC

## ✅ Déjà Fait

1. Configuration JDBC Spring Boot avec multi-datasource (MySQL + Informix)
2. InformixRepository avec méthodes d'accès CBS
3. ReconciliationService avec logique métier
4. ReconciliationController avec API REST
5. Tables de réconciliation MySQL
6. Frontend ReconciliationDashboard React
7. Service API TypeScript

## 🚀 Étapes d'Activation

### Étape 1: Setup Base de Données

```bash
# Créer les tables de réconciliation
node scripts/setup-reconciliation.js
```

Cela va:
- Créer la table `reconciliation_tasks`
- Ajouter colonnes CBS à `corrections`
- Créer vue `reconciliation_stats`
- Créer table `reconciliation_audit`

### Étape 2: Configurer Variables d'Environnement

Ajouter dans `.env`:

```bash
# Spring Boot Backend
VITE_SPRING_BOOT_URL=http://localhost:8080

# Informix CBS
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=your_password
```

### Étape 3: Démarrer le Backend Spring Boot

```bash
cd backend-java

# Option 1: Maven
mvn spring-boot:run

# Option 2: JAR
mvn clean package
java -jar target/data-quality-backend-1.0.0.jar
```

Le backend démarre sur `http://localhost:8080`

### Étape 4: Tester la Connexion

```bash
# Test connexion JDBC
cd backend-java
./test-jdbc-connection.sh

# Test API health
curl http://localhost:8080/api/reconciliation/health

# Test stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/reconciliation/stats
```

### Étape 5: Démarrer le Frontend

```bash
# Terminal séparé
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

### Étape 6: Accéder au Dashboard

Aller sur: `http://localhost:5173/reconciliation/dashboard`

Vous verrez:
- 📊 Statistiques de réconciliation
- 📋 Liste des tâches en attente
- ✅ Boutons d'action réconciliation
- 🔄 Réconciliation individuelle ou en masse

## 🧪 Tests End-to-End

### Test 1: Créer un Ticket avec Corrections

```bash
# Via l'interface ou API
POST http://localhost:3001/api/tickets
{
  "anomaly_id": "...",
  "title": "Correction adresse client",
  "corrections": [
    {
      "field_name": "address",
      "old_value": "123 rue ancien",
      "new_value": "456 rue nouveau"
    }
  ]
}
```

### Test 2: Créer une Tâche de Réconciliation

```sql
INSERT INTO reconciliation_tasks (ticket_id, client_id, status)
VALUES ('TKT-001', 'CLI123456', 'pending');
```

### Test 3: Lancer la Réconciliation

```bash
# Via le dashboard ou API
POST http://localhost:8080/api/reconciliation/TASK_ID/reconcile
```

Résultat attendu:
```json
{
  "task_id": "uuid",
  "status": "success",
  "matched_fields": 8,
  "total_fields": 10,
  "discrepancies": [],
  "checked_at": "2025-01-04T10:00:00"
}
```

## 📊 Monitoring

### Métriques Actuator

```bash
# Health check global
curl http://localhost:8080/actuator/health

# Pool de connexions Informix
curl http://localhost:8080/actuator/metrics/hikari.connections.active

# Métriques Prometheus
curl http://localhost:8080/actuator/prometheus
```

### Logs

```bash
# Suivre les logs en temps réel
tail -f backend-java/logs/application.log

# Mode DEBUG
java -jar backend-java/target/data-quality-backend-1.0.0.jar \
  --logging.level.com.bsic=DEBUG
```

## 🔄 Workflow Complet

```
1. DÉTECTION ANOMALIE
   └─> Frontend détecte anomalie dans CBS
       └─> Stocke dans MySQL (table anomalies)

2. CRÉATION TICKET
   └─> Utilisateur crée ticket avec corrections
       └─> Stocke dans MySQL (table tickets + corrections)
       └─> Crée tâche de réconciliation (reconciliation_tasks)

3. VALIDATION 4 YEUX
   └─> Validateur approuve le ticket
       └─> Déclenche RPA UiPath (optionnel)

4. APPLICATION AU CBS
   └─> RPA applique corrections dans Informix
       └─> Callback webhook de succès

5. RÉCONCILIATION (NOUVEAU!)
   └─> Spring Boot lit CBS via JDBC
       └─> Compare avec corrections attendues
       └─> Calcule écarts (discrepancies)
       └─> Met à jour statut (reconciled/partial/failed)
       └─> Stocke dans reconciliation_audit

6. REPORTING
   └─> Dashboard affiche résultats
       └─> Statistiques de succès/échec
       └─> Alertes si discrepancies
```

## 🎯 Cas d'Usage Principaux

### 1. Réconciliation Automatique (Nuit)

```bash
# Cron job quotidien
0 2 * * * curl -X POST http://localhost:8080/api/reconciliation/reconcile-all \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"max_tasks":1000}'
```

### 2. Réconciliation Agence Spécifique

```typescript
await reconciliationApiService.reconcileAll('AG001', 50);
```

### 3. Retry Échecs

```typescript
const failedTasks = await reconciliationApiService.getHistory({ status: 'failed' });
for (const task of failedTasks) {
  await reconciliationApiService.retryReconciliation(task.id);
}
```

### 4. Analyse Discrepancies

```sql
SELECT
  ra.task_id,
  JSON_EXTRACT(ra.discrepancies, '$[*].field') as fields,
  JSON_EXTRACT(ra.discrepancies, '$[*].severity') as severities
FROM reconciliation_audit ra
WHERE ra.status = 'partial'
AND DATE(ra.performed_at) = CURDATE();
```

## 📝 Ajustements dans le Menu

Ajouter lien dans `Sidebar.tsx`:

```tsx
{
  name: 'Réconciliation CBS',
  href: '/reconciliation/dashboard',
  icon: RefreshCw,
  roles: ['admin', 'auditor']
}
```

## 🔐 Sécurité

### JWT Token

Le ReconciliationController requiert un JWT valide:

```typescript
const token = localStorage.getItem('token');
headers: { Authorization: `Bearer ${token}` }
```

### Roles Requis

- `ROLE_ADMIN`: Accès complet
- `ROLE_AUDITOR`: Lecture + réconciliation
- `ROLE_AGENCY_USER`: Lecture tâches de son agence uniquement

## 🐛 Dépannage

### Erreur: "Cannot connect to Spring Boot"

```bash
# Vérifier que Spring Boot est démarré
curl http://localhost:8080/actuator/health

# Vérifier VITE_SPRING_BOOT_URL dans .env
echo $VITE_SPRING_BOOT_URL
```

### Erreur: "Informix connection failed"

```bash
# Tester depuis Spring Boot
cd backend-java
./test-jdbc-connection.sh

# Vérifier variables
cat .env | grep INFORMIX
```

### Erreur: "Table reconciliation_tasks doesn't exist"

```bash
# Créer les tables
node scripts/setup-reconciliation.js
```

### CORS Error

Le Spring Boot est configuré pour accepter:
- `http://localhost:5173` (Vite dev)
- `http://localhost:3000` (alternative)

Si vous utilisez un autre port, ajouter dans `application.yml`:

```yaml
app.cors.allowed-origins: http://localhost:YOUR_PORT
```

## 📚 Documentation

- [CONNEXION_JDBC_CBS.md](CONNEXION_JDBC_CBS.md) - Guide complet JDBC
- [JDBC_INFORMIX_SETUP.md](JDBC_INFORMIX_SETUP.md) - Setup détaillé
- [backend-java/README.md](backend-java/README.md) - Backend documentation
- [backend-java/QUICK_START.md](backend-java/QUICK_START.md) - Quick start

## ✨ Résultat Final

Une fois configuré, vous aurez:

1. ✅ Backend Spring Boot connecté à Informix via JDBC
2. ✅ Pool de connexions optimisé HikariCP
3. ✅ API REST de réconciliation
4. ✅ Dashboard React avec statistiques
5. ✅ Réconciliation automatique CBS ↔ MySQL
6. ✅ Monitoring via Actuator + Prometheus
7. ✅ Audit trail complet
8. ✅ Alertes sur discrepancies

## 🎉 Commencer Maintenant

```bash
# 1. Setup tables
node scripts/setup-reconciliation.js

# 2. Démarrer backend (terminal 1)
cd backend-java && mvn spring-boot:run

# 3. Démarrer frontend (terminal 2)
npm run dev

# 4. Ouvrir browser
open http://localhost:5173/reconciliation/dashboard

# 5. Profit! 🚀
```
