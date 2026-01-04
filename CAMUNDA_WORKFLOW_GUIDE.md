# 🔄 BSIC Data Quality - Guide Workflow Camunda & RPA

**Version**: 2.0.0
**Date**: 2026-01-04
**Stack**: Camunda BPMN 7.20.0 + Spring Boot + UiPath RPA

---

## 📋 Vue d'Ensemble

Ce document décrit l'implémentation complète du **workflow automatisé de correction d'anomalies** avec **Camunda BPMN** et l'intégration **RPA UiPath**.

---

## 🎯 Architecture du Workflow

### Cycle de Vie Complet (8 États)

```
┌─────────────────────────────────────────────────────────────┐
│                    TICKET WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

1. DETECTED (Détection Anomalie)
   ↓
2. ASSIGNED (Auto-affectation à l'agence)
   ↓
3. IN_PROGRESS (Correction par agent agence)
   ↓
4. PENDING_VALIDATION (Validation 4-yeux)
   ↓
5. VALIDATED (Approuvé par superviseur)
   ↓ (Trigger RPA)
6. UPDATED_CBS (Mise à jour Amplitude via RPA)
   ↓
7. CLOSED (Ticket clôturé)
   ↓
8. KPI Update (Calcul des métriques)
```

---

## 📦 Composants Implémentés

### 1. BPMN Process Definition

**Fichier**: `backend-java/src/main/resources/bpmn/ticket-workflow.bpmn`

**Process ID**: `ticket-correction-process`

**Éléments clés**:
- ✅ Start Event: Anomaly Detected
- ✅ Service Tasks (8): Automated steps
- ✅ User Tasks (2): Manual corrections + validation
- ✅ Gateways (2): Validation decision + RPA success
- ✅ Receive Task: RPA completion callback
- ✅ End Events (2): Success + RPA failure

### 2. JavaDelegates (8 Delegates)

| Delegate | Responsabilité | Fichier |
|----------|---------------|---------|
| **CreateTicketDelegate** | Crée le ticket automatiquement | CreateTicketDelegate.java |
| **AssignTicketDelegate** | Affecte à un agent de l'agence | AssignTicketDelegate.java |
| **RequestValidationDelegate** | Demande validation superviseur | RequestValidationDelegate.java |
| **NotifyRejectionDelegate** | Notifie rejet + retour agent | NotifyRejectionDelegate.java |
| **TriggerRpaDelegate** | Déclenche RPA UiPath | TriggerRpaDelegate.java |
| **HandleRpaFailureDelegate** | Gère échec RPA | HandleRpaFailureDelegate.java |
| **CloseTicketDelegate** | Clôture le ticket | CloseTicketDelegate.java |
| **UpdateKpisDelegate** | Calcule les KPIs | UpdateKpisDelegate.java |

### 3. Services

#### WorkflowService
- Démarre les workflows
- Gère les tâches utilisateur
- Notifications RPA
- Récupération des variables process

#### RpaService
- Crée et suit les jobs RPA
- Webhooks callbacks UiPath
- Retry logic pour jobs échoués
- Nettoyage jobs bloqués

#### KpiService
- Calcul quotidien des KPIs
- Métriques par agence
- Dashboard temps réel

### 4. REST Controllers

#### WorkflowController (`/api/workflow`)
```
POST   /start                              Démarrer workflow
GET    /tasks/user/{userId}                Tâches utilisateur
GET    /tasks/group/{groupId}              Tâches groupe
POST   /tasks/{taskId}/claim               Réclamer tâche
POST   /tasks/{taskId}/complete            Compléter tâche
POST   /tasks/{taskId}/validate            Valider (4-yeux)
GET    /process/{id}/variables             Variables process
GET    /process/{id}/status                Statut process
DELETE /process/{id}                       Supprimer process
```

#### RpaController (`/api/rpa`)
```
POST   /jobs/start                         Démarrer job RPA
POST   /callback                           Webhook UiPath
GET    /jobs/{jobId}                       État job RPA
GET    /jobs/ticket/{ticketId}             Jobs par ticket
GET    /jobs/status/{status}               Jobs par statut
POST   /jobs/{jobId}/retry                 Retry job échoué
GET    /jobs/stuck                         Jobs bloqués
POST   /jobs/cleanup-stuck                 Nettoyer jobs bloqués
```

#### KpiController (`/api/kpis`)
```
GET    /date/{date}                        KPIs par date
GET    /agency/{code}                      KPIs par agence
GET    /agency/{code}/range                KPIs période
GET    /type/{type}/range                  KPIs par type
GET    /type/{type}/average                Moyenne KPI
GET    /dashboard                          Dashboard métriques
POST   /calculate                          Calculer KPIs
```

### 5. Scheduled Jobs

#### KpiScheduler

| Job | Fréquence | Description |
|-----|-----------|-------------|
| **calculateDailyKpis** | `0 0 1 * * ?` (01:00 daily) | Calcul KPIs quotidiens |
| **checkSlaBreaches** | `0 */15 * * * ?` (Every 15min) | Vérification SLA |
| **cleanupStuckRpaJobs** | `0 0 * * * ?` (Hourly) | Nettoyage jobs RPA |

### 6. Database Migrations

#### V3__rpa_jobs.sql
- Table `rpa_jobs` pour tracking RPA
- Indexes optimisés
- Triggers auto-update

#### V4__kpis.sql
- Table `kpis` pour métriques
- 3 types de KPIs:
  - `CLOSURE_RATE` (Taux de clôture)
  - `SLA_COMPLIANCE` (Respect SLA)
  - `AVG_RESOLUTION_TIME` (Temps moyen)

---

## 🚀 Utilisation

### 1. Démarrer un Workflow

```bash
POST /api/workflow/start
{
  "ticketId": 123,
  "clientId": "CLI001",
  "agencyCode": "AGE001",
  "priority": "HIGH"
}

Response:
{
  "success": true,
  "data": "process-instance-uuid",
  "message": "Workflow started"
}
```

### 2. Compléter une Tâche Utilisateur

```bash
# Récupérer les tâches
GET /api/workflow/tasks/user/{userId}

# Réclamer une tâche
POST /api/workflow/tasks/{taskId}/claim
{
  "userId": 5
}

# Compléter la tâche
POST /api/workflow/tasks/{taskId}/complete
{
  "userId": 5,
  "variables": {
    "correctionNotes": "Client address corrected"
  }
}
```

### 3. Valider (Superviseur)

```bash
POST /api/workflow/tasks/{taskId}/validate
{
  "validatorId": 2,
  "approved": true,
  "reason": "Correction verified and approved"
}
```

### 4. Webhook RPA (Appelé par UiPath)

```bash
POST /api/rpa/callback
{
  "jobId": "job-uuid",
  "status": "COMPLETED",
  "resultData": "{\"amplitudeRef\": \"AMP-12345\"}",
  "errorMessage": null
}
```

### 5. Consulter KPIs

```bash
# Dashboard aujourd'hui
GET /api/kpis/dashboard

Response:
{
  "success": true,
  "data": {
    "closureRate": 87.5,
    "slaCompliance": 92.3,
    "avgResolutionTime": 36.5,
    "ticketsTotal": 150,
    "ticketsClosed": 131,
    "ticketsSlaBreached": 10
  }
}

# KPIs agence sur période
GET /api/kpis/agency/AGE001/range?startDate=2026-01-01&endDate=2026-01-31

# Moyenne SLA compliance
GET /api/kpis/type/SLA_COMPLIANCE/average?startDate=2026-01-01&endDate=2026-01-31
```

---

## 🔗 Intégration UiPath

### Configuration

Dans `application.yml`:

```yaml
app:
  rpa:
    uipath:
      url: https://cloud.uipath.com/bsic
      api-key: your-uipath-api-key
      tenant: bsic
      organization: bsic-org
    webhook-url: http://your-server:8080/api/rpa/callback
    timeout-minutes: 30
    max-retries: 3
```

### Payload Envoyé à UiPath

```json
{
  "ticketId": 123,
  "ticketNumber": "20260104000123",
  "clientId": "CLI001",
  "action": "UPDATE_AMPLITUDE",
  "callbackUrl": "http://backend:8080/api/rpa/callback",
  "processInstanceId": "camunda-process-uuid"
}
```

### Callback Attendu

UiPath doit appeler le callback avec:

```json
{
  "jobId": "rpa-job-uuid",
  "status": "COMPLETED",
  "resultData": "{\"amplitudeReference\": \"AMP-12345\", \"timestamp\": \"2026-01-04T10:30:00Z\"}",
  "errorMessage": null
}
```

**Statuts possibles**:
- `PENDING`: Job créé
- `RUNNING`: Job en cours
- `COMPLETED`: Succès
- `FAILED`: Échec

---

## 📊 KPI Types

### 1. CLOSURE_RATE (Taux de Clôture)

**Formule**: `(Tickets Closed / Tickets Total) × 100`

**Target**: 95%

### 2. SLA_COMPLIANCE (Respect SLA)

**Formule**: `(Tickets SLA Respecté / Tickets Closed) × 100`

**Target**: 90%

### 3. AVG_RESOLUTION_TIME (Temps Moyen)

**Formule**: `Moyenne(Temps Résolution)` en heures

**Target**: 48h

---

## 🔐 Sécurité

### Authentification Endpoints

| Endpoint | Rôles Requis |
|----------|--------------|
| `/api/workflow/start` | ADMIN, AUDITOR |
| `/api/workflow/tasks/*` | Authenticated |
| `/api/rpa/callback` | Public (API Key) |
| `/api/rpa/jobs/*` | ADMIN, AUDITOR |
| `/api/kpis/*` | Authenticated |
| `/api/kpis/calculate` | ADMIN |

### API Key RPA

Le webhook RPA est protégé par une API key configurée dans `application.yml`:

```yaml
app:
  rpa:
    uipath:
      api-key: ${UIPATH_API_KEY:change-in-production}
```

---

## 📈 Monitoring

### Camunda Cockpit

Accès: http://localhost:8080/camunda

**Credentials**: admin / admin

**Fonctionnalités**:
- Visualisation processus actifs
- Historique des instances
- Variables process
- Gestion des tâches
- Incidents & erreurs

### Prometheus Metrics

```bash
# Métriques Camunda
curl http://localhost:8080/actuator/prometheus | grep camunda

# Métriques custom
- workflow_tickets_started_total
- workflow_tickets_completed_total
- workflow_tasks_completed_total
- rpa_jobs_total
- rpa_jobs_failed_total
- kpi_calculation_duration_seconds
```

---

## 🐛 Troubleshooting

### Problème: Workflow ne démarre pas

```bash
# Vérifier déploiement BPMN
curl http://localhost:8080/camunda/api/engine/engine/default/process-definition

# Logs
tail -f logs/application.log | grep "ticket-correction-process"
```

### Problème: RPA callback échoue

```bash
# Vérifier jobs en attente
GET /api/rpa/jobs/status/RUNNING

# Forcer timeout jobs bloqués
POST /api/rpa/jobs/cleanup-stuck?timeoutMinutes=30
```

### Problème: KPIs ne se calculent pas

```bash
# Calcul manuel
POST /api/kpis/calculate?date=2026-01-04

# Vérifier scheduler
grep "KpiScheduler" logs/application.log
```

---

## ✅ Tests

### Test Workflow Complet

```bash
# 1. Démarrer workflow
POST /api/workflow/start {...}
# Récupérer processInstanceId

# 2. Vérifier tâches créées
GET /api/workflow/tasks/user/5

# 3. Compléter correction
POST /api/workflow/tasks/{taskId}/complete

# 4. Valider
POST /api/workflow/tasks/{validationTaskId}/validate

# 5. Simuler RPA callback
POST /api/rpa/callback {
  "jobId": "...",
  "status": "COMPLETED"
}

# 6. Vérifier ticket clôturé
GET /api/tickets/{ticketId}
# Status = CLOSED
```

---

## 📚 Ressources

**Documentation Camunda**:
- [BPMN 2.0](https://docs.camunda.org/manual/7.20/reference/bpmn20/)
- [Java Delegates](https://docs.camunda.org/manual/7.20/user-guide/process-engine/delegation-code/)
- [REST API](https://docs.camunda.org/manual/7.20/reference/rest/)

**Code Source**:
- Workflow: `backend-java/src/main/resources/bpmn/`
- Delegates: `backend-java/src/main/java/com/bsic/dataqualitybackend/workflow/delegate/`
- Services: `backend-java/src/main/java/com/bsic/dataqualitybackend/service/`

---

## 🎯 Prochaines Améliorations

- [ ] Notifications email automatiques
- [ ] Dashboard temps réel (WebSocket)
- [ ] Machine Learning prédiction SLA
- [ ] Escalation automatique tickets bloqués
- [ ] Rapports PDF automatiques
- [ ] Intégration MS Teams notifications

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-01-04
