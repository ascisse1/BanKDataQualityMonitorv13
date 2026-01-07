# 🚀 Guide de Déploiement Production

## Vue d'Ensemble

Ce guide détaille le déploiement complet de l'application BSIC Bank Data Quality Monitor en environnement de production.

## 📋 Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Frontend    │    │   Backend    │    │   Backend    │  │
│  │  React/Vite  │◄──►│  Node.js     │◄──►│ Spring Boot  │  │
│  │  Port: 80    │    │  Express     │    │  Port: 8080  │  │
│  │  (Nginx)     │    │  Port: 3001  │    │              │  │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘  │
│                             │                    │           │
│                             ▼                    ▼           │
│                      ┌──────────────┐    ┌──────────────┐  │
│                      │    MySQL     │    │  Informix    │  │
│                      │  Port: 3306  │    │  CBS Core    │  │
│                      └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Options de Déploiement

### Option 1: Serveur Unique (Recommandé pour démarrage)

Tous les composants sur un seul serveur.

**Prérequis Serveur:**
- OS: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- RAM: 8GB minimum, 16GB recommandé
- CPU: 4 cores minimum
- Disque: 50GB SSD
- Réseau: Accès à Informix CBS (10.3.0.66:1526)

### Option 2: Architecture Multi-Serveurs (Production haute disponibilité)

- Serveur 1: Frontend (Nginx)
- Serveur 2: Backend Node.js + Spring Boot
- Serveur 3: MySQL Database
- Réseau interne: Informix CBS

---

## 🔧 Étape 1: Préparation du Serveur

### 1.1 Installation des Dépendances

#### Ubuntu/Debian:
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Java 17+
sudo apt install -y openjdk-17-jdk

# Maven
sudo apt install -y maven

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# PM2 (Process Manager)
sudo npm install -g pm2

# Git
sudo apt install -y git
```

#### CentOS/RHEL:
```bash
# Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Java 17+
sudo yum install -y java-17-openjdk-devel

# Maven
sudo yum install -y maven

# MySQL
sudo yum install -y mysql-server

# Nginx
sudo yum install -y nginx

# PM2
sudo npm install -g pm2

# Git
sudo yum install -y git
```

### 1.2 Configuration Firewall

```bash
# Ouvrir les ports nécessaires
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3306/tcp  # MySQL (si accès externe requis)
sudo ufw enable
```

---

## 📦 Étape 2: Déploiement du Code

### 2.1 Cloner le Repository

```bash
# Créer dossier application
sudo mkdir -p /var/www/bsic-bank
sudo chown $USER:$USER /var/www/bsic-bank
cd /var/www/bsic-bank

# Cloner (ajuster l'URL selon votre repo)
git clone https://your-repo-url.git .

# Ou copier depuis un serveur
scp -r user@dev-server:/path/to/project/* /var/www/bsic-bank/
```

### 2.2 Installation des Dépendances

```bash
cd /var/www/bsic-bank

# Node.js dependencies
npm install --production

# Backend Java (Spring Boot)
cd backend-java
mvn clean package -DskipTests
cd ..
```

---

## 🔐 Étape 3: Configuration Sécurisée

### 3.1 Créer le Fichier de Production `.env`

```bash
cp .env.example .env
nano .env
```

**Configuration Production:**

```bash
# MODE PRODUCTION
VITE_DEMO_MODE=false
DB_TYPE=mysql
NODE_ENV=production

# MySQL Production
DB_HOST=localhost
DB_PORT=3306
DB_USER=bsic_app_user
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=bank_data_quality

# JWT Secret (générer un fort)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=8h

# Informix CBS
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank_prod_user
INFORMIX_PASSWORD=INFORMIX_PASSWORD_HERE

# Backends
SERVER_PORT=8080
PORT=3001
VITE_SPRING_BOOT_URL=http://localhost:8080
VITE_API_URL=http://localhost:3001

# Sécurité
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/bsic-bank/application.log
ENABLE_PERFORMANCE_MONITORING=true
```

### 3.2 Sécuriser les Permissions

```bash
# Protéger .env
chmod 600 .env

# Créer dossier logs
sudo mkdir -p /var/log/bsic-bank
sudo chown $USER:$USER /var/log/bsic-bank
```

---

## 🗄️ Étape 4: Configuration MySQL

### 4.1 Sécuriser MySQL

```bash
sudo mysql_secure_installation
```

### 4.2 Créer la Base de Données et l'Utilisateur

```bash
sudo mysql -u root -p
```

```sql
-- Créer base de données
CREATE DATABASE bank_data_quality CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer utilisateur dédié
CREATE USER 'bsic_app_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';

-- Accorder permissions
GRANT ALL PRIVILEGES ON bank_data_quality.* TO 'bsic_app_user'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier
SHOW GRANTS FOR 'bsic_app_user'@'localhost';

EXIT;
```

### 4.3 Initialiser les Tables

```bash
cd /var/www/bsic-bank

# Créer les tables
npm run setup:mysql

# Tables de réconciliation
npm run db:reconciliation

# (Optionnel) Données de démo pour tests
npm run seed:mysql
```

### 4.4 Optimiser MySQL pour Production

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Ajouter:
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
query_cache_size = 0
query_cache_type = 0

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

Redémarrer MySQL:
```bash
sudo systemctl restart mysql
```

---

## 🏗️ Étape 5: Build Production

### 5.1 Build Frontend React

```bash
cd /var/www/bsic-bank

# Build optimisé
npm run build

# Vérifier les fichiers générés
ls -lah dist/
```

### 5.2 Build Backend Spring Boot

```bash
cd /var/www/bsic-bank/backend-java

# Build JAR de production
mvn clean package -DskipTests

# Le JAR est dans: target/data-quality-backend-1.0.0.jar
```

---

## 🚀 Étape 6: Démarrage des Services

### 6.1 Backend Node.js Express avec PM2

```bash
cd /var/www/bsic-bank

# Démarrer avec PM2
pm2 start server/index.js --name bsic-backend-node

# Sauvegarder pour redémarrage automatique
pm2 save
pm2 startup
```

### 6.2 Backend Spring Boot avec PM2

```bash
cd /var/www/bsic-bank/backend-java

# Créer script de démarrage
cat > start-spring-boot.sh << 'EOF'
#!/bin/bash
java -jar -Xmx2g -Xms1g \
  -Dspring.profiles.active=production \
  target/data-quality-backend-1.0.0.jar
EOF

chmod +x start-spring-boot.sh

# Démarrer avec PM2
pm2 start start-spring-boot.sh --name bsic-backend-spring

# Sauvegarder
pm2 save
```

### 6.3 Vérifier les Services

```bash
# Status
pm2 status

# Logs
pm2 logs bsic-backend-node
pm2 logs bsic-backend-spring

# Tests
curl http://localhost:3001/api/health
curl http://localhost:8080/api/reconciliation/health
```

---

## 🌐 Étape 7: Configuration Nginx

### 7.1 Créer la Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/bsic-bank
```

```nginx
# Serveur HTTP (redirection vers HTTPS)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Serveur HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Paramètres SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend React (fichiers statiques)
    root /var/www/bsic-bank/dist;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend Node.js Express
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API Backend Spring Boot
    location /api/reconciliation/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/bsic-bank-access.log;
    error_log /var/log/nginx/bsic-bank-error.log;
}
```

### 7.2 Activer le Site

```bash
# Créer lien symbolique
sudo ln -s /etc/nginx/sites-available/bsic-bank /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 7.3 Certificat SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 📊 Étape 8: Monitoring & Logs

### 8.1 PM2 Monitoring

```bash
# Dashboard PM2
pm2 monit

# Logs en temps réel
pm2 logs --lines 100

# Métriques
pm2 describe bsic-backend-node
pm2 describe bsic-backend-spring
```

### 8.2 Configuration Rotation des Logs

```bash
sudo nano /etc/logrotate.d/bsic-bank
```

```
/var/log/bsic-bank/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8.3 Monitoring Spring Boot Actuator

Accéder aux métriques:
```bash
# Health check
curl http://localhost:8080/actuator/health

# Métriques
curl http://localhost:8080/actuator/metrics

# Pool connexions
curl http://localhost:8080/actuator/metrics/hikari.connections.active
```

---

## 🔄 Étape 9: Automatisation & Maintenance

### 9.1 Script de Backup MySQL

```bash
sudo nano /opt/bsic-bank/backup-mysql.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/bsic-bank"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="bank_data_quality"
DB_USER="bsic_app_user"
DB_PASS="YOUR_PASSWORD"

mkdir -p $BACKUP_DIR

# Backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Conserver seulement les 7 derniers jours
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
chmod +x /opt/bsic-bank/backup-mysql.sh

# Cron daily backup à 2h du matin
sudo crontab -e
# Ajouter:
0 2 * * * /opt/bsic-bank/backup-mysql.sh >> /var/log/bsic-bank/backup.log 2>&1
```

### 9.2 Script de Mise à Jour

```bash
sudo nano /opt/bsic-bank/update-app.sh
```

```bash
#!/bin/bash

APP_DIR="/var/www/bsic-bank"
BACKUP_DIR="/var/backups/bsic-bank/code"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Mise à jour BSIC Bank Application..."

# Backup code actuel
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz -C $APP_DIR .

# Pull latest code
cd $APP_DIR
git pull origin main

# Update dependencies
npm install --production
cd backend-java && mvn clean package -DskipTests && cd ..

# Build frontend
npm run build

# Restart services
pm2 restart bsic-backend-node
pm2 restart bsic-backend-spring

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Mise à jour terminée!"
pm2 status
```

```bash
chmod +x /opt/bsic-bank/update-app.sh
```

---

## 🔒 Étape 10: Sécurité Renforcée

### 10.1 Fail2Ban (Protection brute-force)

```bash
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/bsic-bank-error.log
maxretry = 5
bantime = 3600
```

```bash
sudo systemctl restart fail2ban
```

### 10.2 Audit de Sécurité

```bash
# Vérifier ports ouverts
sudo netstat -tuln

# Scan vulnérabilités npm
npm audit

# Scan Java dependencies
cd backend-java
mvn dependency-check:check
```

---

## ✅ Checklist de Déploiement

- [ ] Serveur préparé avec toutes les dépendances
- [ ] Code déployé et dépendances installées
- [ ] Fichier `.env` configuré avec valeurs production
- [ ] MySQL installé et base de données créée
- [ ] Tables initialisées (mysql, reconciliation)
- [ ] Frontend build (`npm run build`)
- [ ] Backend Spring Boot build (`mvn package`)
- [ ] Backend Node.js démarré avec PM2
- [ ] Backend Spring Boot démarré avec PM2
- [ ] Nginx configuré et certificat SSL installé
- [ ] Tests API fonctionnels
- [ ] Rotation des logs configurée
- [ ] Backup automatique MySQL configuré
- [ ] Monitoring activé (PM2, Actuator)
- [ ] Fail2Ban configuré
- [ ] Documentation utilisateur fournie

---

## 🆘 Dépannage Production

### Problème: Backend Node.js ne démarre pas

```bash
# Vérifier logs
pm2 logs bsic-backend-node --lines 50

# Vérifier port 3001 disponible
sudo netstat -tuln | grep 3001

# Redémarrer
pm2 restart bsic-backend-node
```

### Problème: Backend Spring Boot erreurs

```bash
# Logs détaillés
pm2 logs bsic-backend-spring --lines 100

# Vérifier connexion MySQL
mysql -u bsic_app_user -p bank_data_quality -e "SELECT 1"

# Vérifier connexion Informix
telnet 10.3.0.66 1526
```

### Problème: Nginx erreur 502

```bash
# Vérifier que les backends sont démarrés
pm2 status

# Tester backends directement
curl http://localhost:3001/api/health
curl http://localhost:8080/api/reconciliation/health

# Logs Nginx
sudo tail -f /var/log/nginx/bsic-bank-error.log
```

---

## 📞 Support Production

Pour toute assistance:
1. Consulter les logs: `/var/log/bsic-bank/`
2. Vérifier PM2: `pm2 status` et `pm2 logs`
3. Vérifier Actuator: `http://localhost:8080/actuator/health`
4. Contacter l'équipe technique

---

**Déploiement réussi!** 🎉

L'application BSIC Bank Data Quality Monitor est maintenant en production et accessible via `https://your-domain.com`
