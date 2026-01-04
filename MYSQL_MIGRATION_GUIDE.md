# Guide de Migration vers MySQL Local

Ce document explique la migration effectuée pour transformer votre application d'une architecture Supabase vers MySQL local.

## 📋 Résumé des Modifications

### 1. Schéma de Base de Données MySQL

**Fichier créé** : `database/mysql-schema.sql`

Ce fichier contient :
- ✅ Conversion complète des 10 migrations Supabase PostgreSQL vers MySQL
- ✅ 13 tables principales (bkcli, bkcom, bkadcli, bktelcli, bkemacli, bkcoj, bkpscm, users, fatca_clients, fatca_audit_log, agency_correction_stats, anomaly_history, data_load_history, user_audit_log)
- ✅ Index optimisés pour les performances
- ✅ Vues SQL pour les rapports (vw_fatca_statistics, vw_fatca_clients_by_indicia)
- ✅ Clés étrangères et contraintes d'intégrité

**Différences PostgreSQL → MySQL** :
- `SERIAL` → `INT AUTO_INCREMENT`
- `TIMESTAMP WITH TIME ZONE` → `TIMESTAMP`
- `INTEGER` → `INT`
- Syntaxe des vues adaptée à MySQL
- Types ENUM utilisés pour les champs avec valeurs limitées

### 2. Service de Connexion MySQL

**Fichier créé** : `server/mysqlDatabase.js`

Fonctionnalités :
- ✅ Pool de connexions MySQL avec `mysql2/promise`
- ✅ Configuration depuis variables d'environnement
- ✅ Fonctions d'exécution de requêtes (executeQuery, executeTransaction)
- ✅ Fonctions métier pré-construites :
  - `getClientStats()` - Statistiques clients
  - `getValidationMetrics()` - Métriques de validation par type
  - `getAnomalies()` - Récupération d'anomalies avec pagination
  - `getFATCAStats()` - Statistiques FATCA
  - `getAgencyCorrectionStats()` - Statistiques par agence
- ✅ Gestion des erreurs et logging
- ✅ Fermeture propre des connexions

### 3. Scripts d'Initialisation

#### Script de Setup (`scripts/setup-mysql.js`)
- ✅ Création automatique de la base de données
- ✅ Exécution du schéma SQL
- ✅ Vérification de la création des tables
- ✅ Messages d'erreur détaillés et conseils de dépannage

#### Script de Seeding (`scripts/seed-mysql.js`)
- ✅ Insertion de 6 utilisateurs par défaut avec mots de passe hashés
- ✅ Insertion de clients de démonstration (particuliers, entreprises, institutionnels)
- ✅ Insertion de données FATCA
- ✅ Insertion de statistiques d'agences
- ✅ Gestion des doublons (INSERT avec vérification)

### 4. Configuration Environnement

**Fichiers modifiés** :
- `.env` - Ajout des variables MySQL
- `.env.example` - Modèle mis à jour avec toutes les variables

**Nouvelles variables** :
```env
# Type de base de données
DB_TYPE=mysql

# Configuration MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bank_data_quality

# JWT Configuration
JWT_SECRET=...
JWT_EXPIRES_IN=24h
```

### 5. Scripts NPM

**Fichier modifié** : `package.json`

**Nouveaux scripts** :
- `npm run setup:mysql` - Initialise la base de données
- `npm run seed:mysql` - Insère les données de démonstration
- `npm run db:init` - Exécute setup + seed en une commande

### 6. Documentation

**Fichiers créés** :
- `database/MYSQL_SETUP.md` - Guide complet d'installation et configuration MySQL
- `MYSQL_MIGRATION_GUIDE.md` - Ce document

**Fichiers modifiés** :
- `README.md` - Mise à jour avec instructions MySQL

## 🚀 Guide de Démarrage Rapide

### Étape 1 : Installer MySQL

**Windows** : Télécharger depuis [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)

**macOS** :
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian)** :
```bash
sudo apt install mysql-server
sudo systemctl start mysql
```

### Étape 2 : Configurer l'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres MySQL
nano .env  # ou votre éditeur préféré
```

Ajustez ces valeurs dans `.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=bank_data_quality
```

### Étape 3 : Initialiser la Base de Données

```bash
# Installation des dépendances si pas déjà fait
npm install

# Création de la base et insertion des données
npm run db:init
```

### Étape 4 : Démarrer l'Application

```bash
npm run dev:full
```

L'application sera accessible à :
- Frontend : http://localhost:5173
- Backend API : http://localhost:3001

## 👤 Comptes de Test

Utilisez ces comptes pour vous connecter après le seeding :

| Username | Password | Rôle |
|----------|----------|------|
| admin | admin123 | Administrateur |
| auditor | admin123 | Auditeur |
| user | admin123 | Utilisateur |
| agency_01001 | agency01001 | Utilisateur Agence |
| agency_01002 | agency01002 | Utilisateur Agence |
| agency_01003 | agency01003 | Utilisateur Agence |

## 📊 Structure de la Base de Données

### Tables Clients
- **bkcli** - Informations clients (particuliers, entreprises, institutionnels)
- **bkcom** - Comptes bancaires
- **bkadcli** - Adresses clients
- **bktelcli** - Téléphones clients
- **bkemacli** - Emails clients
- **bkcoj** - Co-titulaires
- **bkpscm** - Mandataires

### Tables Système
- **users** - Utilisateurs de l'application
- **user_audit_log** - Journal d'audit utilisateurs

### Tables FATCA
- **fatca_clients** - Clients avec indices FATCA
- **fatca_audit_log** - Journal d'audit FATCA

### Tables de Suivi
- **agency_correction_stats** - Statistiques de correction par agence
- **anomaly_history** - Historique des anomalies
- **data_load_history** - Historique des chargements de données

## 🔧 Dépannage

### Erreur : "Access denied for user 'root'@'localhost'"

Vérifiez le mot de passe MySQL dans `.env` :
```env
DB_PASSWORD=votre_mot_de_passe_correct
```

### Erreur : "ECONNREFUSED 127.0.0.1:3306"

MySQL n'est pas démarré. Lancez-le :
```bash
# Windows
services.msc  # Vérifier le service MySQL

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### Erreur : "ER_BAD_DB_ERROR: Unknown database"

Relancez le script de setup :
```bash
npm run setup:mysql
```

### Réinitialisation Complète

Pour repartir de zéro :
```bash
# Se connecter à MySQL
mysql -u root -p

# Supprimer la base de données
DROP DATABASE IF EXISTS bank_data_quality;
exit;

# Réinitialiser
npm run db:init
```

## 📈 Prochaines Étapes

### Pour Aller Plus Loin

1. **Sécurité Production** :
   - Changer le `JWT_SECRET` dans `.env`
   - Créer un utilisateur MySQL dédié (ne pas utiliser root)
   - Activer SSL/TLS pour les connexions MySQL

2. **Performance** :
   - Ajuster les paramètres MySQL dans `my.cnf`
   - Augmenter `innodb_buffer_pool_size`
   - Configurer le cache de requêtes

3. **Backup** :
   - Mettre en place des sauvegardes automatiques
   - Utiliser `mysqldump` pour les exports réguliers
   - Stocker les backups hors serveur

4. **Monitoring** :
   - Installer MySQL Workbench pour le monitoring
   - Configurer des alertes de performance
   - Surveiller l'utilisation disque

## 🆘 Support

Pour plus d'aide :

1. **Documentation MySQL** : [dev.mysql.com/doc](https://dev.mysql.com/doc/)
2. **Documentation du projet** : Voir `database/MYSQL_SETUP.md`
3. **Logs** : Consulter la console du serveur backend
4. **Erreurs** : Vérifier les logs MySQL dans `/var/log/mysql/` (Linux/Mac) ou les Event Logs (Windows)

## 📝 Notes Importantes

### Différences avec Supabase

1. **Authentication** : JWT géré localement au lieu de Supabase Auth
2. **RLS (Row Level Security)** : Implémenté au niveau applicatif plutôt qu'au niveau DB
3. **Real-time** : Non disponible (était fourni par Supabase)
4. **Storage** : Pas de stockage de fichiers intégré
5. **Edge Functions** : Remplacées par des endpoints Express

### Compatibilité

- ✅ Toutes les fonctionnalités principales sont préservées
- ✅ Les performances sont optimisées avec les index MySQL
- ✅ La pagination et le filtrage fonctionnent de la même manière
- ✅ Les exports Excel/PDF/CSV sont inchangés
- ✅ L'authentification et l'autorisation fonctionnent de la même manière

### Migration des Données Existantes

Si vous avez des données dans Supabase que vous souhaitez migrer :

1. **Export depuis Supabase** :
```bash
# Utiliser l'API Supabase pour exporter les données
# Ou utiliser pgAdmin pour exporter en CSV
```

2. **Import dans MySQL** :
```bash
# Utiliser LOAD DATA INFILE ou des scripts d'import
mysql -u root -p bank_data_quality < export_data.sql
```

3. **Script personnalisé** :
Créer un script Node.js qui lit depuis Supabase et écrit dans MySQL.

## ✅ Checklist de Vérification

Avant de considérer la migration terminée :

- [ ] MySQL est installé et fonctionne
- [ ] La base de données `bank_data_quality` existe
- [ ] Toutes les 13 tables sont créées
- [ ] Les données de démonstration sont insérées
- [ ] L'application démarre sans erreur (`npm run dev:full`)
- [ ] La connexion à l'interface fonctionne
- [ ] Les comptes de test permettent de se connecter
- [ ] Le dashboard affiche les données
- [ ] Les anomalies sont visibles
- [ ] Les exports fonctionnent

---

**Migration réussie !** 🎉

Votre application est maintenant prête à fonctionner avec MySQL local de manière autonome et performante.

**Développé avec ❤️ pour la surveillance de la qualité des données bancaires**
