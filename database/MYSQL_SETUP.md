# MySQL Database Configuration

Ce document explique comment configurer et utiliser MySQL avec le Bank Data Quality Monitor.

## 📋 Prérequis

### Installation de MySQL

#### Windows
1. Télécharger MySQL Community Server depuis [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)
2. Installer MySQL avec l'installateur
3. Noter le mot de passe root pendant l'installation

#### macOS
```bash
# Avec Homebrew
brew install mysql
brew services start mysql

# Configurer le mot de passe root
mysql_secure_installation
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

#### Vérifier l'installation
```bash
mysql --version
```

## 🚀 Configuration Initiale

### 1. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `.env` et ajustez les valeurs :

```bash
cp .env.example .env
```

Éditez le fichier `.env` :

```env
# Mode démo désactivé - utilise MySQL local
VITE_DEMO_MODE=false

# Type de base de données
DB_TYPE=mysql

# Configuration MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=bank_data_quality

# JWT Configuration
JWT_SECRET=votre_secret_jwt_securise
JWT_EXPIRES_IN=24h
```

### 2. Création de la base de données et des tables

Exécutez le script de setup :

```bash
npm run setup:mysql
```

Ce script va :
- ✅ Créer la base de données `bank_data_quality`
- ✅ Créer toutes les tables nécessaires
- ✅ Créer les index pour optimiser les performances
- ✅ Créer les vues pour les rapports

### 3. Insertion des données de démonstration

Exécutez le script de seeding :

```bash
npm run seed:mysql
```

Ce script va insérer :
- 👥 6 utilisateurs par défaut (admin, auditor, user, 3 agency users)
- 👤 8 clients particuliers (dont 3 avec anomalies)
- 🏢 4 clients entreprises (dont 1 avec anomalies)
- 🏛️  3 clients institutionnels (dont 1 avec anomalies)
- 🌍 3 clients FATCA
- 📊 3 agences avec statistiques

### 4. Démarrage de l'application

```bash
npm run dev:full
```

Cette commande démarre :
- Le serveur backend Express (port 3001)
- Le serveur frontend Vite (port 5173)

## 🎯 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run setup:mysql` | Crée la base de données et les tables |
| `npm run seed:mysql` | Insère les données de démonstration |
| `npm run db:init` | Exécute setup + seed en une commande |
| `npm run dev:full` | Démarre l'application complète |
| `npm run server` | Démarre uniquement le serveur backend |
| `npm run dev` | Démarre uniquement le frontend |

## 👤 Comptes de démonstration

Après le seeding, vous pouvez vous connecter avec :

| Username | Password | Rôle | Description |
|----------|----------|------|-------------|
| `admin` | `admin123` | Administrateur | Accès complet |
| `auditor` | `admin123` | Auditeur | Consultation et rapports |
| `user` | `admin123` | Utilisateur | Accès standard |
| `agency_01001` | `agency01001` | Utilisateur Agence | Agence Ganhi |
| `agency_01002` | `agency01002` | Utilisateur Agence | Agence Haie Vive |
| `agency_01003` | `agency01003` | Utilisateur Agence | Agence Cadjehoun |

## 📊 Structure de la Base de Données

### Tables Principales

#### bkcli - Clients
Contient tous les clients (particuliers, entreprises, institutionnels)

#### bkcom - Comptes
Comptes bancaires associés aux clients

#### bkadcli - Adresses
Adresses postales des clients

#### bktelcli - Téléphones
Numéros de téléphone des clients

#### bkemacli - Emails
Adresses email des clients

### Tables de Suivi

#### users - Utilisateurs
Comptes utilisateurs de l'application

#### agency_correction_stats - Statistiques par agence
Statistiques de correction des anomalies par agence

#### anomaly_history - Historique des anomalies
Historique complet des détections et corrections d'anomalies

#### data_load_history - Historique des chargements
Suivi des imports de données

### Tables FATCA

#### fatca_clients - Clients FATCA
Clients avec indices FATCA

#### fatca_audit_log - Audit FATCA
Journal d'audit des actions FATCA

## 🔧 Dépannage

### Erreur : "Access denied for user 'root'@'localhost'"

**Solution :** Vérifiez votre mot de passe MySQL dans le fichier `.env`

```env
DB_PASSWORD=votre_mot_de_passe_correct
```

### Erreur : "ECONNREFUSED 127.0.0.1:3306"

**Solution :** MySQL n'est pas démarré

Windows :
```bash
# Vérifier le service MySQL dans les Services Windows
services.msc
```

macOS :
```bash
brew services start mysql
```

Linux :
```bash
sudo systemctl start mysql
sudo systemctl status mysql
```

### Erreur : "ER_BAD_DB_ERROR: Unknown database"

**Solution :** Lancez d'abord le script de setup

```bash
npm run setup:mysql
```

### Erreur : "ER_DUP_ENTRY: Duplicate entry"

**Solution :** Les données existent déjà. Pour réinitialiser :

```sql
-- Connectez-vous à MySQL
mysql -u root -p

-- Supprimez et recréez la base de données
DROP DATABASE bank_data_quality;
CREATE DATABASE bank_data_quality CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Quittez MySQL
exit;
```

Puis relancez :
```bash
npm run db:init
```

### Erreur : Port 3001 déjà utilisé

**Solution :** Un autre processus utilise le port

Windows :
```bash
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

macOS/Linux :
```bash
lsof -i :3001
kill -9 <pid>
```

## 📈 Performance et Optimisation

### Index créés automatiquement

Le schéma MySQL inclut des index sur :
- Les clés primaires
- Les colonnes fréquemment recherchées (cli, tcli, age, nat, etc.)
- Les colonnes de jointure
- Les colonnes utilisées dans les filtres

### Paramètres MySQL recommandés

Pour de meilleures performances, ajustez votre fichier `my.cnf` ou `my.ini` :

```ini
[mysqld]
# Buffer pool size (70-80% de la RAM disponible pour MySQL)
innodb_buffer_pool_size = 1G

# Taille du log pour les transactions
innodb_log_file_size = 256M

# Connexions simultanées
max_connections = 200

# Cache de requêtes
query_cache_size = 64M
query_cache_type = 1
```

## 🔒 Sécurité

### En production

1. **Changez le JWT_SECRET** dans le fichier `.env`
2. **Utilisez des mots de passe forts** pour les comptes utilisateurs
3. **Créez un utilisateur MySQL dédié** (ne pas utiliser root)

```sql
CREATE USER 'bdm_user'@'localhost' IDENTIFIED BY 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON bank_data_quality.* TO 'bdm_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Limitez l'accès réseau** à MySQL

```ini
[mysqld]
bind-address = 127.0.0.1
```

## 📝 Backup et Restore

### Backup

```bash
# Backup complet
mysqldump -u root -p bank_data_quality > backup.sql

# Backup avec date
mysqldump -u root -p bank_data_quality > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
mysql -u root -p bank_data_quality < backup.sql
```

## 🆘 Support

Pour plus d'aide :
- 📧 Consultez les logs du serveur backend
- 🔍 Vérifiez les erreurs dans la console du navigateur
- 📚 Consultez la documentation MySQL : [dev.mysql.com/doc](https://dev.mysql.com/doc/)

---

**Développé avec ❤️ pour la surveillance de la qualité des données bancaires**
