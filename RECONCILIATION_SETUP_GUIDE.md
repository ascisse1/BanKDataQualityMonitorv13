# Guide de Configuration - Réconciliation CBS

## Vue d'ensemble

Ce guide explique comment configurer et utiliser le système de réconciliation entre l'application de qualité des données et le Core Banking System (CBS - Informix).

## Prérequis

### 1. Drivers ODBC Informix

**Windows:**
```powershell
# Télécharger IBM Informix Client SDK depuis:
# https://www.ibm.com/products/informix/client-sdk

# Installer le SDK
# Suivre les instructions dans INFORMIX_SETUP.md
```

**Linux:**
```bash
# Installer les drivers ODBC Informix
sudo apt-get install unixodbc unixodbc-dev
# Télécharger et installer Informix Client SDK
```

### 2. Configuration DSN ODBC

**Windows (Recommandé):**

1. Ouvrir "ODBC Data Sources (64-bit)"
2. Aller dans l'onglet "DSN système"
3. Cliquer sur "Ajouter"
4. Sélectionner "IBM INFORMIX ODBC DRIVER"
5. Configurer:
   ```
   Data Source Name: lcb
   Description: BSIC Core Banking System
   Server Name: ol_bdmsa
   Host Name: 10.3.0.66
   Service/Port: 1526
   Database Name: bdmsa
   User ID: bank
   ```
6. Tester la connexion

### 3. Configuration Variables d'Environnement

Créer/modifier le fichier `.env`:

```bash
# ===========================================
# CONFIGURATION CBS (INFORMIX)
# ===========================================

# Méthode 1: DSN ODBC (Recommandé pour Windows)
INFORMIX_DSN=lcb

# Méthode 2: Connexion directe (Alternative)
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_USER=bank
INFORMIX_PASSWORD=your_password_here
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa

# Mode dégradé (si CBS non disponible)
ALLOW_DEGRADED_MODE=false

# ===========================================
# CONFIGURATION MYSQL
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bank_data_quality
```

## Installation

### Étape 1: Installer les Dépendances

```bash
# Installer toutes les dépendances
npm install

# Le package 'odbc' est optionnel et sera installé si disponible
```

### Étape 2: Créer le Schéma MySQL

```bash
# Exécuter le script de migration
mysql -u root -p bank_data_quality < database/mysql-reconciliation-schema.sql

# Ou via script Node.js
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'bank_data_quality',
    multipleStatements: true
  });

  const sql = fs.readFileSync('database/mysql-reconciliation-schema.sql', 'utf8');
  await connection.query(sql);
  console.log('✅ Schema created successfully');
  await connection.end();
}

setup();
"
```

### Étape 3: Tester les Connexions

```bash
# Tester la connexion Informix
npm run test:informix

# Tester le DSN ODBC
npm run test:dsn

# Diagnostic complet
npm run diagnose:informix
```

## Architecture de la Réconciliation

### Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DÉTECTION D'ANOMALIES                                    │
│    Interface → Informix CBS → Détection → MySQL            │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CORRECTION PAR L'UTILISATEUR                            │
│    Utilisateur → Validation → Approbation                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. APPLICATION AU CBS (RPA)                                │
│    MySQL → RPA Bot → Informix CBS Update                    │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. RÉCONCILIATION (VÉRIFICATION)                           │
│    MySQL → Lecture CBS → Comparaison → Mise à jour statut  │
└─────────────────────────────────────────────────────────────┘
```

### Tables MySQL

1. **reconciliation_tasks**
   - Tâches de réconciliation en attente
   - Statut: pending, reconciled, partial, failed
   - Historique des tentatives

2. **corrections** (extensions)
   - `cbs_value`: Valeur actuelle dans le CBS
   - `is_matched`: Indique si la valeur correspond
   - `last_checked_at`: Date de la dernière vérification

## Utilisation

### Interface Web

1. **Accéder à la page de réconciliation:**
   ```
   http://localhost:5175/reconciliation
   ```

2. **Fonctionnalités disponibles:**
   - Voir les tâches en attente
   - Lancer une réconciliation individuelle
   - Réconcilier en batch (jusqu'à 50 tâches)
   - Voir l'historique des réconciliations
   - Exporter les rapports

### API Endpoints

#### GET /api/reconciliation/pending
Récupérer les tâches en attente.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reconciliation/pending?agency_code=AG001"
```

#### POST /api/reconciliation/:id/reconcile
Lancer une réconciliation.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reconciliation/TASK_ID/reconcile"
```

#### POST /api/reconciliation/reconcile-all
Réconciliation en batch.

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agency_code":"AG001","max_tasks":50}' \
  "http://localhost:3001/api/reconciliation/reconcile-all"
```

#### GET /api/reconciliation/stats
Statistiques de réconciliation.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/reconciliation/stats?agency_code=AG001"
```

## Scripts Utiles

### Script de Test de Connexion CBS

```javascript
// scripts/test-reconciliation.js
import informixDb from '../server/informixDatabase.js';

async function testReconciliation() {
  try {
    console.log('Testing CBS connection...');
    const pool = await informixDb.createPool();
    const connection = await pool.connect();

    // Lire un client du CBS
    const clientId = 'CLI123456';
    const result = await connection.query(`
      SELECT nom, prenom, adresse, telephone, email
      FROM clients
      WHERE client_id = ?
    `, [clientId]);

    console.log('Client data from CBS:', result[0]);
    await connection.close();
    console.log('✅ Test successful');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReconciliation();
```

### Script de Réconciliation Manuelle

```javascript
// scripts/manual-reconciliation.js
import { getMySQLPool, getInformixPool } from '../server/hybridDatabase.js';

async function reconcileClient(clientId) {
  const mysqlPool = getMySQLPool();
  const informixPool = getInformixPool();

  // 1. Lire les corrections depuis MySQL
  const [corrections] = await mysqlPool.execute(
    'SELECT * FROM corrections WHERE client_id = ?',
    [clientId]
  );

  // 2. Lire les données du CBS
  const cbsConnection = await informixPool.connect();
  const cbsData = await cbsConnection.query(
    'SELECT * FROM clients WHERE client_id = ?',
    [clientId]
  );

  // 3. Comparer
  for (const correction of corrections) {
    const cbsValue = cbsData[0][correction.field_name];
    const isMatched = cbsValue === correction.new_value;

    console.log(`Field: ${correction.field_name}`);
    console.log(`  Expected: ${correction.new_value}`);
    console.log(`  CBS: ${cbsValue}`);
    console.log(`  Match: ${isMatched ? '✅' : '❌'}`);
  }

  await cbsConnection.close();
}

reconcileClient(process.argv[2]);
```

## Monitoring et Logs

### Logs de Réconciliation

Les logs sont stockés dans:
```
logs/reconciliation-YYYY-MM-DD.log
```

Format:
```json
{
  "timestamp": "2025-01-04T10:00:00Z",
  "task_id": "uuid",
  "client_id": "CLI123456",
  "status": "success",
  "matched_fields": 8,
  "total_fields": 10,
  "duration_ms": 1234
}
```

### Métriques Importantes

- **Taux de succès**: % de réconciliations réussies
- **Temps moyen**: Durée moyenne d'une réconciliation
- **Taux d'échec**: % d'échecs nécessitant intervention
- **Écarts critiques**: Champs à haute sévérité non concordants

## Dépannage

### Erreur: "CBS unavailable"

**Cause**: Impossible de se connecter au CBS Informix.

**Solutions**:
1. Vérifier que le serveur Informix est accessible:
   ```bash
   ping 10.3.0.66
   telnet 10.3.0.66 1526
   ```

2. Tester le DSN:
   ```bash
   npm run test:dsn
   ```

3. Vérifier les logs Informix

### Erreur: "ODBC drivers not installed"

**Cause**: Les drivers ODBC Informix ne sont pas installés.

**Solution**:
1. Installer IBM Informix Client SDK
2. Configurer les variables d'environnement
3. Voir `INFORMIX_SETUP.md` pour les détails

### Erreur: "Task not found"

**Cause**: La tâche de réconciliation n'existe pas.

**Solution**:
1. Vérifier que le ticket est approuvé
2. Vérifier que la tâche a été créée:
   ```sql
   SELECT * FROM reconciliation_tasks WHERE ticket_id = 'TKT-001';
   ```

### Échecs de Réconciliation

**Causes possibles**:
1. Données non mises à jour dans le CBS (RPA en attente)
2. Format de données différent
3. Normalisation incorrecte

**Solution**:
1. Vérifier l'état du RPA
2. Consulter les logs de réconciliation
3. Réessayer manuellement

## Sécurité

### Credentials CBS

Ne jamais exposer les credentials dans:
- Code source
- Logs
- Messages d'erreur
- Réponses API

Utiliser uniquement:
- Variables d'environnement (`.env`)
- Gestionnaire de secrets (Azure Key Vault, AWS Secrets Manager)

### Audit Trail

Toutes les réconciliations sont tracées:
```sql
SELECT * FROM reconciliation_tasks
WHERE client_id = 'CLI123456'
ORDER BY created_at DESC;
```

### Rate Limiting

Le système limite à 10 réconciliations/minute pour éviter de surcharger le CBS.

## Performance

### Optimisations

1. **Connection Pooling**: Réutilisation des connexions ODBC
2. **Batch Processing**: Traitement par lot de 50 tâches max
3. **Cache**: Résultats mis en cache 5 minutes
4. **Index**: Index sur client_id, ticket_id, status

### Temps de Réponse Typiques

- Réconciliation individuelle: 1-2 secondes
- Batch de 50 tâches: 30-60 secondes
- Lecture CBS: 200-500ms par client

## Maintenance

### Nettoyage Automatique

Les tâches réconciliées > 90 jours sont automatiquement archivées:

```sql
CALL sp_cleanup_old_reconciliation_tasks(90);
```

### Backup

Sauvegarder régulièrement:
```bash
mysqldump bank_data_quality reconciliation_tasks corrections > backup.sql
```

## Support

En cas de problème:

1. Consulter `CBS_RECONCILIATION_ARCHITECTURE.md`
2. Vérifier `TROUBLESHOOTING_INFORMIX.md`
3. Consulter les logs: `logs/reconciliation-*.log`
4. Contacter l'équipe support avec:
   - ID de la tâche
   - Logs d'erreur
   - Configuration `.env` (sans passwords)
