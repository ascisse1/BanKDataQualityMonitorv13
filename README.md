# BSIC Bank Data Quality Monitor v13

Application de contrôle et validation de la qualité des données bancaires pour la BSIC.

## Architecture

```
Frontend React (Vite)          Backend Java (Spring Boot)
Port 5174                      Port 8080
     │                              │
     └──────────────►───────────────┤
                                    ├──► MySQL (Port 3306)
                                    │    - Authentification
                                    │    - Utilisateurs
                                    │    - Règles de gestion
                                    │    - KPIs
                                    │
                                    └──► Informix CBS (JDBC Direct)
                                         - Clients FATCA
                                         - Anomalies métier
                                         - Réconciliation CBS
```

## Technologies

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, React Router

**Backend:** Java 17, Spring Boot 3.2.1, Spring Security, Hibernate, Camunda BPM 7.21

**Bases de données:** MySQL 8+, IBM Informix 12+ (via JDBC)

## Installation Rapide

### Prérequis
- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8+

### 1. Configurer MySQL
```sql
CREATE DATABASE bank_data_quality CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :
```bash
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=bank_data_quality

# Informix (si disponible)
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank

# JWT
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=24h

# API
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Démarrer l'application

**Option 1 : Automatique (Windows PowerShell)**
```powershell
.\start-application.ps1
```

**Option 2 : Manuelle**

Terminal 1 - Backend Java:
```bash
cd backend-java
mvn spring-boot:run -DskipTests
```

Terminal 2 - Frontend React:
```bash
npm install
npm run dev
```

## Accès

- **Frontend** : http://localhost:5174
- **Backend API** : http://localhost:8080
- **Camunda Cockpit** : http://localhost:8080/camunda (admin / admin)

## Comptes de Test

| Rôle | Email | Password |
|------|-------|----------|
| Admin | admin@bsic.sn | admin |
| Auditeur | auditor@bsic.sn | auditor123 |
| Agence | agency@bsic.sn | agency123 |

## Fonctionnalités Principales

- Authentification JWT sécurisée
- Dashboard avec statistiques et métriques
- Validation FATCA (clients individuels et corporate)
- Gestion des anomalies avec workflow
- Réconciliation CBS automatique
- Workflows Camunda automatisés
- Calcul automatique des KPIs
- Exports et rapports personnalisés

## Configuration Informix

### Avec Informix disponible

Dans `backend-java/src/main/resources/application-local.yml` :
```yaml
app:
  features:
    informix-integration: true
```

Locales disponibles (si erreur "Database locale mismatch"):
- `fr_FR.819` (ISO 8859-1 français) - **Par défaut**
- `en_US.819` (ISO 8859-1 anglais)
- `fr_FR.utf8` (UTF-8 français)
- `en_US.utf8` (UTF-8 anglais)

### Sans Informix (Mode dégradé)

Dans `backend-java/src/main/resources/application-local.yml` :
```yaml
app:
  features:
    informix-integration: false
```

L'application démarre avec MySQL uniquement.

Fonctionnalités disponibles :
- ✅ Authentification
- ✅ Gestion utilisateurs
- ✅ Règles de validation
- ✅ Dashboard (données MySQL)
- ❌ Réconciliation CBS temps réel
- ❌ Données FATCA CBS temps réel

## Build Production

```bash
# Frontend
npm run build

# Backend
cd backend-java
mvn clean package -DskipTests

# JAR généré : backend-java/target/data-quality-backend-1.0.0.jar
```

## Troubleshooting

### Port 8080 déjà utilisé
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Erreur Database locale mismatch
Modifier la locale dans `application-local.yml` :
```yaml
spring:
  datasource:
    informix:
      jdbc-url: jdbc:informix-sqli://10.3.0.66:1526/bdmsa:INFORMIXSERVER=ol_bdmsa;DELIMIDENT=Y;DB_LOCALE=fr_FR.819;CLIENT_LOCALE=fr_FR.819
```

### Backend ne démarre pas
1. Vérifier Java 17+ : `java -version`
2. Vérifier MySQL : `mysql -u root -p`
3. Désactiver temporairement Informix (voir Mode dégradé)

## Structure du Projet

```
bank-data-quality-monitor-v13/
├── backend-java/               # Backend Spring Boot + Camunda
│   ├── src/main/java/         # Code Java
│   ├── src/main/resources/    # Configurations + BPMN
│   └── pom.xml
├── src/                       # Frontend React + TypeScript
│   ├── components/            # Composants UI
│   ├── pages/                # Pages/Routes
│   ├── services/             # Services API
│   └── context/              # React Context
├── server/                    # Serveur Node.js (auth legacy)
├── database/                  # Scripts SQL
├── scripts/                   # Scripts utilitaires
├── .env                      # Variables d'environnement
└── package.json              # Dépendances frontend
```

## API Endpoints Principaux

### Authentification
```
POST /api/auth/login
POST /api/auth/change-password
```

### Utilisateurs
```
GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Anomalies
```
GET  /api/anomalies
PUT  /api/anomalies/{id}/correct
GET  /api/anomalies/statistics
```

### FATCA
```
GET  /api/fatca/clients
GET  /api/fatca/corporate
GET  /api/fatca/statistics
```

### Réconciliation
```
POST /api/reconciliation/run
GET  /api/reconciliation/results
```

## Sécurité

- JWT avec expiration configurable
- Bcrypt pour les mots de passe
- CORS configuré
- Spring Security
- Validation des entrées
- RLS sur les bases de données

## License

Propriétaire - BSIC (Banque Sahélo-Saharienne pour l'Investissement et le Commerce)

---

**Version:** 13.0.0
**Date:** 2026-01-05
