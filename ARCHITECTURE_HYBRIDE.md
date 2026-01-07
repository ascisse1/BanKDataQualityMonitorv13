# Architecture Hybride : MySQL + Informix

Ce document décrit l'architecture hybride de l'application de monitoring de qualité des données bancaires.

## Vue d'ensemble

L'application utilise **deux bases de données différentes** pour séparer les responsabilités:

### 🔐 MySQL - Données Applicatives
- **Authentification des utilisateurs**
- **Gestion des utilisateurs et des rôles**
- **Règles de gestion et configuration**
- **Logs et historique des actions**
- **Configuration LDAP**

### 📊 Informix - Données Métier
- **Données FATCA** (clients particuliers et entreprises)
- **Anomalies** (individuelles, corporates, institutionnelles)
- **Données clients** (bkcli, bkcom, etc.)
- **Statistiques et métriques métier**

## Configuration

### 1. Prérequis

#### Pour MySQL (Données Applicatives)
```bash
# Installer MySQL Server
# Windows: https://dev.mysql.com/downloads/installer/
# Linux: sudo apt-get install mysql-server

# Créer la base de données
mysql -u root -p
CREATE DATABASE bank_data_quality;
```

#### Pour Informix (Données Métier)
- Installer **IBM Informix Client SDK**
- Configurer **ODBC Data Source**
Voir [INFORMIX_SETUP.md](./INFORMIX_SETUP.md) pour les instructions détaillées

### 2. Configuration du fichier .env

```env
# Mode démo (false pour utiliser les vraies bases de données)
DEMO_MODE=false
VITE_DEMO_MODE=false

# Type de base de données principale pour les données métier
DB_TYPE=informix

# Configuration Informix (Données métier: FATCA, Anomalies)
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank
INFORMIX_SERVER=ol_bdmsa
INFORMIX_DATABASE=bdmsa

# Configuration MySQL (Données applicatives: Auth, Règles)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=bank_data_quality

# JWT Configuration
JWT_SECRET=bank_data_quality_secret_key_2024_change_in_production
JWT_EXPIRES_IN=24h
```

### 3. Initialisation des bases de données

#### MySQL - Créer les tables d'authentification
```bash
npm run setup:mysql
npm run seed:mysql
```

#### Informix - Vérifier la connectivité
Les données métier sont déjà présentes dans Informix. L'application se connecte automatiquement.

## Flux de données

### Connexion utilisateur
1. L'utilisateur entre ses identifiants
2. **MySQL** vérifie les credentials
3. Un JWT est généré
4. L'utilisateur accède à l'application

### Consultation des anomalies
1. L'utilisateur demande la liste des anomalies
2. L'application requête **Informix**
3. Les données FATCA/anomalies sont récupérées
4. Les résultats sont affichés

### Modification des règles de gestion
1. Un admin modifie une règle
2. La modification est enregistrée dans **MySQL**
3. Les nouvelles règles sont appliquées aux futures validations

## Modes de fonctionnement

### Mode Production (Hybride)
```env
DEMO_MODE=false
DB_TYPE=informix
```
- MySQL: Authentification active
- Informix: Données métier réelles

### Mode Démo Complet
```env
DEMO_MODE=true
```
- Toutes les données sont fictives
- Aucune base de données requise
- Utile pour les présentations

### Mode Dégradé Automatique
Si Informix n'est pas disponible:
- L'authentification continue via MySQL
- Les données métier passent en mode démo
- L'application reste fonctionnelle

## Dépannage

### MySQL non disponible
❌ **Symptôme**: Erreur "MySQL connection failed"

✅ **Solution**:
1. Vérifier que MySQL est démarré
```bash
# Windows
services.msc  # Rechercher MySQL

# Linux
sudo systemctl status mysql
```

2. Vérifier les credentials dans .env
3. Tester la connexion:
```bash
mysql -h localhost -u root -p
```

### Informix non disponible
❌ **Symptôme**: Message "ODBC drivers not installed"

✅ **Solution**:
1. Installer IBM Informix Client SDK
2. Configurer ODBC Data Source
3. Voir [INFORMIX_SETUP.md](./INFORMIX_SETUP.md)

**Alternative**: Utiliser MySQL pour tout
```env
DB_TYPE=mysql
```
Puis migrer les données métier vers MySQL (voir [MYSQL_MIGRATION_GUIDE.md](./MYSQL_MIGRATION_GUIDE.md))

## Avantages de l'architecture hybride

✅ **Séparation des responsabilités**
- Données applicatives vs données métier
- Facilite la maintenance

✅ **Flexibilité**
- Possibilité de migrer progressivement
- Mode dégradé automatique

✅ **Performance**
- Chaque base optimisée pour son usage
- Requêtes plus rapides

✅ **Sécurité**
- Isolation des données sensibles
- Credentials séparés

## Migration future vers MySQL complet

Si vous souhaitez migrer complètement vers MySQL:
1. Voir le guide [MYSQL_MIGRATION_GUIDE.md](./MYSQL_MIGRATION_GUIDE.md)
2. Utiliser les scripts de migration fournis
3. Changer `DB_TYPE=mysql` dans .env

## Support

Pour toute question:
- Consulter [README.md](./README.md)
- Vérifier les logs dans la console serveur
- Tester en mode démo d'abord
