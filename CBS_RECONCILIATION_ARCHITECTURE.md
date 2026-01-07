# Architecture de Réconciliation CBS

## Vue d'ensemble

L'application utilise une **architecture hybride** pour se connecter au Core Banking System (CBS):

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Frontend                      │
│                  (React + TypeScript)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Node.js)                       │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   MySQL Pool     │         │  Informix Pool   │         │
│  │  (Application)   │         │     (CBS)        │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            ↓                              ↓
   ┌────────────────┐           ┌─────────────────┐
   │  MySQL Server  │           │ Informix Server │
   │                │           │  (Core Banking) │
   │  • Users       │           │  • Clients      │
   │  • Tickets     │           │  • Accounts     │
   │  • Anomalies   │           │  • FATCA        │
   │  • Rules       │           │  • Transactions │
   └────────────────┘           └─────────────────┘
```

## 1. Architecture Hybride

### MySQL (Base Applicative)
- **Rôle**: Gestion de l'application
- **Données**:
  - Authentification et utilisateurs
  - Tickets et workflows
  - Anomalies détectées
  - Corrections proposées
  - Règles de validation
  - Historique des actions

### Informix (Core Banking System)
- **Rôle**: Système bancaire de référence
- **Données**:
  - Clients et comptes réels
  - Transactions bancaires
  - Données FATCA officielles
  - Données KYC (Know Your Customer)
  - Informations réglementaires

## 2. Processus de Réconciliation

### Étape 1: Détection d'Anomalie
```
1. Chargement des données depuis Informix (CBS)
   ↓
2. Application des règles de validation
   ↓
3. Détection d'anomalies
   ↓
4. Enregistrement dans MySQL (table anomalies)
```

### Étape 2: Correction
```
1. Utilisateur consulte les anomalies (depuis MySQL)
   ↓
2. Utilisateur propose une correction
   ↓
3. Validation "4 yeux" (workflow)
   ↓
4. Correction enregistrée dans MySQL
```

### Étape 3: Réconciliation CBS
```
1. Lecture des corrections approuvées (MySQL)
   ↓
2. Connexion au CBS (Informix)
   ↓
3. Lecture des données actuelles du CBS
   ↓
4. Comparaison champ par champ
   ↓
5. Détection des écarts
   ↓
6. Mise à jour du statut dans MySQL
```

## 3. Configuration de la Connexion CBS

### Fichier .env
```bash
# ===========================================
# INFORMIX CBS CONNECTION
# ===========================================
# Méthode 1: Utiliser un DSN ODBC (Recommandé pour Windows)
INFORMIX_DSN=your_dsn_name

# Méthode 2: Connexion directe
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank_password
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa

# Mode dégradé (sans Informix)
ALLOW_DEGRADED_MODE=false
```

### Configuration DSN ODBC (Windows)

1. **Ouvrir ODBC Data Sources (64-bit)**
   - Panneau de configuration → Outils d'administration → Sources de données ODBC

2. **Créer un nouveau DSN système**
   - Onglet "DSN système" → Ajouter
   - Sélectionner "IBM INFORMIX ODBC DRIVER"

3. **Configurer le DSN**
   ```
   Data Source Name: lcb (ou votre nom)
   Description: BSIC Core Banking System
   Server Name: ol_bdmsa
   Host Name: 10.3.0.66
   Service/Port: 1526
   Database Name: bdmsa
   User ID: bank
   ```

4. **Tester la connexion**
   ```powershell
   # Script PowerShell de test
   .\scripts\test-dsn-connection.js
   ```

## 4. API de Réconciliation

### Endpoints Backend

#### GET /api/reconciliation/pending
Récupère les tâches en attente de réconciliation.

**Paramètres**:
- `agency_code` (optionnel): Filtrer par agence
- `client_id` (optionnel): Filtrer par client

**Réponse**:
```json
[
  {
    "id": "uuid",
    "ticket_id": "TKT-001",
    "client_id": "CLI123456",
    "client_name": "DUPONT Jean",
    "corrections": [
      {
        "field": "address",
        "field_label": "Adresse",
        "expected_value": "123 rue de Paris",
        "cbs_value": "123 rue de Pari",
        "is_matched": false
      }
    ],
    "status": "pending",
    "attempts": 0,
    "created_at": "2025-01-04T10:00:00Z"
  }
]
```

#### POST /api/reconciliation/:taskId/reconcile
Lance la réconciliation d'une tâche spécifique.

**Réponse**:
```json
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
  "checked_at": "2025-01-04T10:05:00Z"
}
```

#### POST /api/reconciliation/reconcile-all
Lance la réconciliation en batch.

**Body**:
```json
{
  "agency_code": "AG001",
  "max_tasks": 50
}
```

**Réponse**:
```json
{
  "success": 45,
  "failed": 3,
  "total": 48
}
```

## 5. Implémentation Technique

### Service de Réconciliation (Backend)

```javascript
// server/reconciliationService.js

class ReconciliationService {
  async reconcileTask(taskId) {
    // 1. Récupérer la tâche depuis MySQL
    const task = await this.getTask(taskId);

    // 2. Se connecter au CBS (Informix)
    const cbsConnection = await informixPool.connect();

    // 3. Lire les données actuelles du client dans le CBS
    const query = `
      SELECT client_id, nom, prenom, adresse, ville, code_postal,
             telephone, email, date_naissance
      FROM clients
      WHERE client_id = ?
    `;
    const cbsData = await cbsConnection.query(query, [task.client_id]);

    // 4. Comparer chaque champ
    const discrepancies = [];
    for (const correction of task.corrections) {
      const cbsValue = cbsData[0][correction.field];
      const isMatched = this.compareValues(
        correction.expected_value,
        cbsValue
      );

      if (!isMatched) {
        discrepancies.push({
          field: correction.field,
          expected_value: correction.expected_value,
          actual_value: cbsValue,
          severity: this.calculateSeverity(correction.field)
        });
      }
    }

    // 5. Mettre à jour le statut dans MySQL
    const status = discrepancies.length === 0 ? 'reconciled' : 'partial';
    await this.updateTaskStatus(taskId, status, discrepancies);

    await cbsConnection.close();

    return {
      status,
      matched_fields: task.corrections.length - discrepancies.length,
      total_fields: task.corrections.length,
      discrepancies
    };
  }

  compareValues(expected, actual) {
    // Normalisation des valeurs
    const normalize = (val) => {
      if (!val) return '';
      return val.toString().trim().toLowerCase();
    };

    return normalize(expected) === normalize(actual);
  }

  calculateSeverity(field) {
    // Champs critiques = haute sévérité
    const criticalFields = ['client_id', 'tax_id', 'nationality'];
    if (criticalFields.includes(field)) return 'high';

    const mediumFields = ['name', 'address', 'phone'];
    if (mediumFields.includes(field)) return 'medium';

    return 'low';
  }
}
```

## 6. Sécurité et Performance

### Connexions Pool
```javascript
// Pooling pour optimiser les performances
const informixPool = await odbc.pool(connectionString, {
  connectionTimeout: 30,
  loginTimeout: 30
});
```

### Gestion des Erreurs
```javascript
try {
  const result = await reconcile(taskId);
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // CBS non accessible
    await markTaskAsFailed(taskId, 'CBS timeout');
  } else if (error.code === 'ECONNREFUSED') {
    // CBS refusé
    await markTaskAsFailed(taskId, 'CBS connection refused');
  }
}
```

### Rate Limiting
```javascript
// Limiter à 10 réconciliations par minute pour ne pas surcharger le CBS
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.post('/api/reconciliation/:id/reconcile', rateLimiter, ...);
```

## 7. Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DÉTECTION INITIALE (Batch nocturne)                      │
│    - Lecture CBS → Détection anomalies → Stockage MySQL     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CORRECTION (Interface utilisateur)                       │
│    - Utilisateur agence corrige → Validation 4 yeux         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. APPLICATION AU CBS (RPA)                                 │
│    - RPA applique correction → Update CBS Informix          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. RÉCONCILIATION (Vérification)                           │
│    - Lecture CBS → Comparaison → Validation finale          │
└─────────────────────────────────────────────────────────────┘
```

## 8. Monitoring et Logs

### Logs de Connexion
```javascript
logger.info('CBS connection established', {
  dsn: informixConfig.dsn,
  user: informixConfig.user,
  timestamp: new Date()
});
```

### Métriques
- Temps de réponse CBS
- Taux de succès de réconciliation
- Nombre d'écarts détectés
- Temps moyen de réconciliation

### Alertes
- CBS non accessible pendant > 5 minutes
- Taux d'échec > 20%
- Temps de réponse > 10 secondes

## 9. Mode Dégradé

Si le CBS n'est pas accessible:

```javascript
if (!isInformixAvailable) {
  // Mode lecture seule
  // Afficher les dernières données en cache
  // Bloquer les réconciliations
  // Alerter les administrateurs
}
```

## 10. Documentation Technique

Fichiers de référence:
- `INFORMIX_SETUP.md` - Installation des drivers
- `DSN_CONNECTION_GUIDE.md` - Configuration DSN
- `INFORMIX_ERROR_23101.md` - Résolution erreurs
- `TROUBLESHOOTING_INFORMIX.md` - Dépannage

## Scripts Utiles

```bash
# Tester la connexion CBS
npm run test:informix

# Tester le DSN ODBC
npm run test:dsn

# Diagnostiquer les problèmes
npm run diagnose:informix
```
