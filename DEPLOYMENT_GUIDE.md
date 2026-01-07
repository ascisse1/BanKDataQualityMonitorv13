# 📚 BSIC Data Quality Backend - Guide de Déploiement

**Version**: 1.0.0
**Date**: 2026-01-04
**Architecture**: Spring Boot 3.2.1 + PostgreSQL + React

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation PostgreSQL](#installation-postgresql)
3. [Configuration Backend Spring Boot](#configuration-backend-spring-boot)
4. [Configuration Frontend React](#configuration-frontend-react)
5. [Déploiement On-Premise](#déploiement-on-premise)
6. [Configuration LDAP/Active Directory](#configuration-ldapactive-directory)
7. [Monitoring et Supervision](#monitoring-et-supervision)
8. [Sécurité](#sécurité)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Serveur Backend

| Composant | Version Minimum | Recommandé |
|-----------|----------------|------------|
| **Java** | 17 | 21 |
| **Maven** | 3.8+ | 3.9+ |
| **PostgreSQL** | 14+ | 16+ |
| **RAM** | 4 GB | 8 GB |
| **CPU** | 2 cores | 4 cores |
| **Disque** | 20 GB | 50 GB |
| **OS** | Windows Server 2016+ / Linux | Windows Server 2022 |

### Serveur Frontend

| Composant | Version Minimum |
|-----------|----------------|
| **Node.js** | 18+ |
| **npm** | 9+ |
| **Nginx** | 1.20+ |

### Réseau

- Port **8080** : Backend Spring Boot API
- Port **5432** : PostgreSQL
- Port **3000/5173** : Frontend Dev Server
- Port **80/443** : Nginx (Production)
- Port **389/636** : LDAP/Active Directory

---

## 🗄️ Installation PostgreSQL

### Windows

```powershell
# 1. Télécharger PostgreSQL 16
# https://www.postgresql.org/download/windows/

# 2. Installer PostgreSQL avec les options par défaut
# - Port: 5432
# - Mot de passe superuser: à définir

# 3. Ajouter PostgreSQL au PATH
setx PATH "%PATH%;C:\Program Files\PostgreSQL\16\bin"

# 4. Créer la base de données
psql -U postgres
```

```sql
-- Créer la base de données
CREATE DATABASE bank_data_quality;

-- Créer un utilisateur dédié
CREATE USER bsic_app WITH ENCRYPTED PASSWORD 'ChangeMe123!';

-- Donner les droits
GRANT ALL PRIVILEGES ON DATABASE bank_data_quality TO bsic_app;

-- Se connecter à la base
\c bank_data_quality

-- Donner les droits sur le schéma public
GRANT ALL ON SCHEMA public TO bsic_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO bsic_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO bsic_app;

\q
```

### Linux (Ubuntu/Debian)

```bash
# 1. Installer PostgreSQL
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# 2. Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Créer la base et l'utilisateur
sudo -u postgres psql

CREATE DATABASE bank_data_quality;
CREATE USER bsic_app WITH ENCRYPTED PASSWORD 'ChangeMe123!';
GRANT ALL PRIVILEGES ON DATABASE bank_data_quality TO bsic_app;

\c bank_data_quality
GRANT ALL ON SCHEMA public TO bsic_app;
\q
```

---

## 🚀 Configuration Backend Spring Boot

### 1. Cloner le Projet

```bash
cd /opt/bsic
git clone <repository-url> data-quality-backend
cd data-quality-backend/backend-java
```

### 2. Configuration application.yml

Modifier `src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bank_data_quality
    username: bsic_app
    password: ChangeMe123!

  ldap:
    urls: ldap://your-ad-server:389
    base: dc=bsic,dc=local
    username: cn=admin,dc=bsic,dc=local
    password: YourLdapPassword

camunda:
  bpm:
    admin-user:
      password: ChangeMeCamundaPassword

app:
  jwt:
    secret: bsic-data-quality-secret-key-MUST-CHANGE-IN-PRODUCTION-256-bits-minimum
    expiration: 86400000
  cors:
    allowed-origins: http://localhost:5173,http://your-frontend-domain
```

### 3. Compiler le Projet

```bash
mvn clean install -DskipTests
```

### 4. Exécuter les Migrations

```bash
# Les migrations Flyway sont automatiques au démarrage
# Fichiers dans: src/main/resources/db/migration/
```

### 5. Démarrer l'Application

```bash
# Mode développement
mvn spring-boot:run

# Mode production
java -jar target/data-quality-backend-1.0.0.jar
```

### 6. Vérifier le Démarrage

```bash
# Health check
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}
```

---

## 🎨 Configuration Frontend React

### 1. Installation des Dépendances

```bash
cd /opt/bsic/data-quality-frontend
npm install
```

### 2. Configuration .env

Créer `.env.production`:

```bash
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=BSIC Data Quality Monitor
```

### 3. Build Production

```bash
npm run build
```

Le dossier `dist/` contient les fichiers statiques à déployer.

---

## 🏢 Déploiement On-Premise

### Option 1: Serveur Windows avec IIS

#### Backend Spring Boot

```powershell
# 1. Créer un service Windows
sc create BsicDataQualityBackend binPath= "C:\Java\jdk-17\bin\java.exe -jar C:\bsic\backend\app.jar" start= auto

# 2. Démarrer le service
sc start BsicDataQualityBackend

# 3. Vérifier
sc query BsicDataQualityBackend
```

#### Frontend avec IIS

```powershell
# 1. Installer IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# 2. Copier les fichiers dans wwwroot
Copy-Item -Path dist\* -Destination C:\inetpub\wwwroot\bsic-app -Recurse

# 3. Configurer le site IIS
New-IISSite -Name "BSIC Data Quality" -BindingInformation "*:80:" -PhysicalPath C:\inetpub\wwwroot\bsic-app
```

### Option 2: Serveur Linux avec Nginx

#### Backend Spring Boot (systemd)

```bash
# 1. Créer le service
sudo nano /etc/systemd/system/bsic-backend.service
```

```ini
[Unit]
Description=BSIC Data Quality Backend
After=postgresql.service

[Service]
Type=simple
User=bsic
WorkingDirectory=/opt/bsic/backend
ExecStart=/usr/bin/java -jar /opt/bsic/backend/app.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 2. Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable bsic-backend
sudo systemctl start bsic-backend

# 3. Vérifier
sudo systemctl status bsic-backend
```

#### Frontend avec Nginx

```bash
# 1. Installer Nginx
sudo apt install nginx

# 2. Configuration Nginx
sudo nano /etc/nginx/sites-available/bsic-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/bsic-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# 3. Activer le site
sudo ln -s /etc/nginx/sites-available/bsic-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Copier les fichiers frontend
sudo cp -r dist/* /var/www/bsic-app/
```

---

## 🔐 Configuration LDAP/Active Directory

### 1. Test de Connexion LDAP

```bash
# Linux
ldapsearch -x -H ldap://your-ad-server:389 -D "cn=admin,dc=bsic,dc=local" -w password -b "dc=bsic,dc=local"

# Windows
dsquery user -name "John*"
```

### 2. Configuration dans application.yml

```yaml
spring:
  ldap:
    urls: ldap://ad-server.bsic.local:389
    base: dc=bsic,dc=local
    username: cn=serviceaccount,ou=Service Accounts,dc=bsic,dc=local
    password: ServiceAccountPassword
```

### 3. Mapping des Groupes AD

Modifier `LdapUserService.java` pour mapper les groupes AD aux rôles applicatifs:

```java
// CN=BSIC-DataQuality-Admins,OU=Groups,DC=bsic,DC=local → ROLE_ADMIN
// CN=BSIC-DataQuality-Auditors,OU=Groups,DC=bsic,DC=local → ROLE_AUDITOR
// CN=BSIC-DataQuality-AgencyUsers,OU=Groups,DC=bsic,DC=local → ROLE_AGENCY_USER
```

---

## 📊 Monitoring et Supervision

### Prometheus

```bash
# 1. Télécharger Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz

# 2. Configuration prometheus.yml
scrape_configs:
  - job_name: 'bsic-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']

# 3. Démarrer Prometheus
./prometheus --config.file=prometheus.yml
```

### Grafana

```bash
# 1. Installer Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get install grafana

# 2. Démarrer Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# 3. Accéder à Grafana
# http://localhost:3000
# Login: admin / admin
```

---

## 🔒 Sécurité

### 1. Configuration TLS/SSL

#### Générer un Certificat

```bash
# Auto-signé (développement)
keytool -genkeypair -alias bsic-app -keyalg RSA -keysize 2048 \
  -storetype PKCS12 -keystore keystore.p12 -validity 3650

# Production: utiliser Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

#### Configuration Spring Boot

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: changeit
    key-store-type: PKCS12
    key-alias: bsic-app
```

### 2. Pare-feu

```bash
# Linux (ufw)
sudo ufw allow 8080/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Windows
netsh advfirewall firewall add rule name="BSIC Backend" dir=in action=allow protocol=TCP localport=8080
```

### 3. Sécurisation PostgreSQL

```bash
# Modifier pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    bank_data_quality  bsic_app     127.0.0.1/32            scram-sha-256
host    bank_data_quality  bsic_app     ::1/128                 scram-sha-256
```

---

## 🐛 Troubleshooting

### Problème: Backend ne démarre pas

```bash
# Vérifier les logs
tail -f /var/log/bsic-backend/application.log

# Vérifier PostgreSQL
sudo systemctl status postgresql
psql -U bsic_app -d bank_data_quality -h localhost

# Vérifier le port
netstat -tulpn | grep 8080
```

### Problème: Erreur de connexion LDAP

```bash
# Test de connexion
ldapsearch -x -H ldap://your-server:389 -D "cn=admin,dc=bsic,dc=local" -w password

# Vérifier les logs Spring
grep "LDAP" application.log
```

### Problème: Frontend ne se connecte pas au Backend

```bash
# Vérifier CORS
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  http://localhost:8080/api/auth/login -v

# Vérifier le proxy Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Support

**Équipe Technique BSIC**
Email: support-dataequality@bsic.local
Téléphone: +XXX XXX XXX

**Documentation Complète**:
- [API Documentation](http://localhost:8080/swagger-ui.html)
- [Camunda Workflow](http://localhost:8080/camunda)
- [Prometheus Metrics](http://localhost:8080/actuator/prometheus)

---

## ✅ Checklist de Déploiement

- [ ] PostgreSQL installé et configuré
- [ ] Base de données créée avec migrations appliquées
- [ ] Java 17+ installé
- [ ] Backend Spring Boot démarre correctement
- [ ] Frontend compilé (npm run build)
- [ ] Nginx configuré (si Linux)
- [ ] LDAP/AD configuré et testé
- [ ] Certificats SSL installés
- [ ] Pare-feu configuré
- [ ] Monitoring (Prometheus/Grafana) configuré
- [ ] Logs centralisés configurés
- [ ] Backup PostgreSQL programmé
- [ ] Tests d'intégration exécutés
- [ ] Formation des utilisateurs effectuée

---

**Status**: ✅ Ready for Deployment
**Last Updated**: 2026-01-04
