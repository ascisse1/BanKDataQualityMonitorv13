# Configuration CoreBanking via JDBC

## 📋 Vue d'ensemble

L'application dispose désormais d'une interface d'administration complète pour configurer les connexions JDBC aux bases de données CoreBanking (Informix, Oracle, MySQL, PostgreSQL).

Cette fonctionnalité remplace progressivement les connexions ODBC par des connexions JDBC plus robustes et portables.

## 🔑 Accès

**Réservé aux administrateurs uniquement**

1. Connectez-vous avec un compte administrateur
2. Dans le menu latéral, cliquez sur **"Configuration CoreBanking"**
3. Accédez directement à : `http://localhost:5174/corebanking-config`

## ✨ Fonctionnalités

### 1. Gestion des configurations

- ✅ Créer plusieurs configurations de connexion
- ✅ Modifier les configurations existantes
- ✅ Supprimer les configurations
- ✅ Activer/Désactiver des configurations
- ✅ Définir une configuration par défaut

### 2. Types de bases de données supportés

- **Informix** (CoreBanking BSIC)
- **Oracle**
- **MySQL**
- **PostgreSQL**

### 3. Gestion des drivers JDBC

- ✅ **Téléchargement automatique** des drivers depuis Maven Central
- ✅ Vérification du statut d'installation des drivers
- ✅ Suppression des drivers installés
- ✅ Barre de progression du téléchargement
- ✅ Support des drivers : Informix, Oracle, MySQL, PostgreSQL

### 4. Test de connexion

- Test de connexion en temps réel depuis la liste ou depuis le formulaire
- Affichage du temps de réponse
- Historique des tests
- Messages d'erreur détaillés

## 🚀 Utilisation

### Télécharger un driver JDBC

**Important** : Avant de configurer une connexion, vous devez d'abord télécharger le driver JDBC correspondant.

1. En haut de la page, vous verrez la section **"Drivers JDBC"**
2. Identifiez le driver dont vous avez besoin (Informix, Oracle, MySQL, PostgreSQL)
3. Vérifiez le statut :
   - ✅ **Installé** (vert) : Le driver est prêt à être utilisé
   - ❌ **Non installé** (gris) : Le driver doit être téléchargé

4. Pour télécharger un driver :
   - Cliquez sur le bouton **"Télécharger"**
   - Une barre de progression s'affiche
   - Le téléchargement se fait automatiquement depuis Maven Central
   - Une fois terminé, le statut passe à "Installé"

5. Pour supprimer un driver :
   - Cliquez sur le bouton **"Supprimer"**
   - Confirmez la suppression

#### Drivers disponibles

| Base de données | Driver | Version | Taille approximative |
|----------------|--------|---------|---------------------|
| Informix | IBM Informix JDBC | 4.50.10 | ~2 MB |
| Oracle | Oracle JDBC Driver | 21.9.0.0 | ~4 MB |
| MySQL | MySQL Connector/J | 8.2.0 | ~2.5 MB |
| PostgreSQL | PostgreSQL JDBC | 42.7.1 | ~1 MB |

### Créer une nouvelle configuration

1. Cliquez sur **"Nouvelle configuration"**
2. Remplissez le formulaire :
   - **Nom de la configuration** : Ex. "Informix Production"
   - **Type de base** : Sélectionnez le type (Informix, Oracle, etc.)
   - **Hôte** : Adresse du serveur (ex: `localhost` ou `10.83.254.192`)
   - **Port** : Port de connexion (ex: `9088` pour Informix)
   - **Nom de la base** : Nom de la base de données (ex: `lcb`)
   - **Utilisateur** : Nom d'utilisateur de connexion
   - **Mot de passe** : Mot de passe
   - **INFORMIXSERVER** : (Informix uniquement) Ex: `ol_informix1210`

3. Cliquez sur l'icône **"Rafraîchir"** pour générer automatiquement l'URL JDBC
4. Configurez les paramètres avancés :
   - **Taille du pool** : Nombre de connexions simultanées (défaut: 10)
   - **Timeout** : Délai d'attente en secondes (défaut: 30)
   - **Requête de test** : Requête SQL pour tester la connexion

5. Cochez les options :
   - **Active** : La configuration est utilisable
   - **Configuration par défaut** : Utilisée par défaut par l'application

6. **Tester la connexion avant de sauvegarder** :
   - Cliquez sur le bouton **"Tester la connexion"** en bas du formulaire
   - Attendez le résultat du test
   - Si le test est réussi (vert), vous pouvez enregistrer la configuration
   - Si le test échoue (rouge), vérifiez vos paramètres et corrigez-les

7. Cliquez sur **"Enregistrer"**

### Tester une connexion

#### Test depuis le formulaire (avant sauvegarde)

1. Remplissez tous les champs du formulaire
2. Cliquez sur le bouton **"Tester la connexion"** en bas du formulaire
3. Le système affiche immédiatement le résultat :
   - ✅ **Connexion réussie** (vert) avec temps de réponse
   - ❌ **Échec de connexion** (rouge) avec message d'erreur détaillé
4. Vous pouvez corriger les paramètres et retester avant de sauvegarder

#### Test depuis la liste (après sauvegarde)

1. Dans la liste des configurations, cliquez sur **"Tester"**
2. Le bouton affiche "Test en cours..." pendant l'exécution
3. Résultats affichés sous la configuration :
   - ✅ **Connexion réussie** (vert) avec temps de réponse
   - ❌ **Échec de connexion** (rouge) avec message d'erreur

### Modifier une configuration

1. Cliquez sur **"Modifier"** sur la configuration souhaitée
2. Modifiez les champs nécessaires
3. Cliquez sur **"Enregistrer"**

### Définir une configuration par défaut

1. Cliquez sur **"Définir par défaut"** sur la configuration souhaitée
2. Cette configuration sera utilisée pour toutes les requêtes CoreBanking

## 🔧 Configuration Informix (Exemple)

### Configuration typique pour BSIC

```
Nom : Informix CoreBanking Production
Type : Informix
Hôte : localhost (ou 10.83.254.192)
Port : 9088
Base : lcb
Utilisateur : bank
Mot de passe : [votre_mot_de_passe]
INFORMIXSERVER : ol_informix1210
```

### URL JDBC générée automatiquement

```
jdbc:informix-sqli://localhost:9088/lcb:INFORMIXSERVER=ol_informix1210;CLIENT_LOCALE=en_US.utf8;DB_LOCALE=en_US.utf8
```

### Requête de test Informix

```sql
SELECT 1 FROM systables WHERE tabid = 1
```

## 🔐 Sécurité

- ✅ Accès réservé aux administrateurs uniquement
- ✅ Mots de passe masqués dans l'interface
- ✅ Stockage sécurisé des configurations
- ✅ Validation des paramètres de connexion
- ✅ Logs d'audit des tests de connexion

## 📊 Architecture

### Backend

Les configurations sont stockées dans un fichier JSON local :
```
server/corebanking-configs.json
```

### Endpoints API

#### Gestion des configurations

```
GET    /api/corebanking/configs           - Liste toutes les configurations
GET    /api/corebanking/configs/:id       - Récupère une configuration
GET    /api/corebanking/configs/default   - Récupère la configuration par défaut
POST   /api/corebanking/configs           - Crée une nouvelle configuration
PUT    /api/corebanking/configs/:id       - Met à jour une configuration
DELETE /api/corebanking/configs/:id       - Supprime une configuration
POST   /api/corebanking/test-connection   - Teste une connexion
POST   /api/corebanking/test-connection/:id - Teste une configuration par ID
POST   /api/corebanking/configs/:id/set-default - Définit comme défaut
GET    /api/corebanking/query             - Exécute une requête SQL
```

#### Gestion des drivers JDBC

```
GET    /api/corebanking/drivers           - Liste tous les drivers et leur statut
GET    /api/corebanking/drivers/:dbType/check - Vérifie si un driver est installé
POST   /api/corebanking/drivers/:dbType/download - Télécharge un driver (SSE stream)
DELETE /api/corebanking/drivers/:dbType  - Supprime un driver installé
```

### Communication avec le backend Java

Les tests de connexion et l'exécution des requêtes sont délégués au backend Java Spring Boot :

```
Backend Java : http://localhost:8080
Endpoint : /api/corebanking/test-connection
```

## 🔄 Migration ODBC → JDBC

### Avantages du JDBC

1. **Portabilité** : Fonctionne sur tous les OS sans configuration système
2. **Performance** : Connexions plus rapides et pool de connexions natif
3. **Sécurité** : Meilleure gestion des credentials
4. **Maintenance** : Pas besoin de DSN système
5. **Flexibilité** : Configuration à chaud sans redémarrage

### Étapes de migration

1. ✅ Créer une configuration JDBC dans l'interface
2. ✅ Tester la connexion
3. ✅ Définir comme configuration par défaut
4. ✅ L'application utilisera automatiquement JDBC au lieu d'ODBC

## 🛠️ Dépannage

### Erreur "Driver not installed" ou "Driver not found"

**Cause** : Le driver JDBC n'est pas installé sur le système

**Solution** :
1. Allez dans la section "Drivers JDBC" en haut de la page
2. Identifiez le type de base de données (Informix, Oracle, MySQL, PostgreSQL)
3. Cliquez sur "Télécharger" pour le driver correspondant
4. Attendez la fin du téléchargement (barre de progression)
5. Vérifiez que le statut passe à "Installé"
6. Retestez votre connexion

### Erreur de téléchargement du driver

**Cause** : Échec du téléchargement depuis Maven Central

**Solution** :
- Vérifiez votre connexion Internet
- Vérifiez que l'URL Maven Central est accessible
- Vérifiez les permissions du dossier `backend-java/lib`
- Téléchargez manuellement le driver et placez-le dans `backend-java/lib/`

### Erreur "Connection refused"

**Cause** : Le serveur de base de données n'est pas accessible

**Solution** :
- Vérifiez que le serveur est démarré
- Vérifiez le host et le port
- Vérifiez les règles firewall

### Erreur "Invalid credentials"

**Cause** : Utilisateur ou mot de passe incorrect

**Solution** :
- Vérifiez le nom d'utilisateur et mot de passe
- Vérifiez les permissions de l'utilisateur sur la base

### Erreur "Database not found"

**Cause** : La base de données n'existe pas

**Solution** :
- Vérifiez le nom de la base de données
- Vérifiez que la base est créée et accessible

### Erreur "Driver not found"

**Cause** : Le driver JDBC n'est pas disponible

**Solution** :
- Vérifiez que le backend Java a le driver dans ses dépendances
- Pour Informix : `com.informix.jdbc.IfxDriver`
- Vérifiez le fichier `pom.xml` du backend Java

### Erreur "Timeout"

**Cause** : La connexion prend trop de temps

**Solution** :
- Augmentez le timeout dans la configuration
- Vérifiez la latence réseau
- Vérifiez la charge du serveur de base de données

## 📝 Notes importantes

1. **Backend Java requis** : Les connexions JDBC nécessitent le backend Java Spring Boot
2. **Drivers JDBC** : Assurez-vous que les drivers sont présents dans le backend Java
3. **Sécurité** : Ne partagez jamais les configurations contenant des mots de passe
4. **Tests réguliers** : Testez régulièrement les connexions pour détecter les problèmes

## 🔮 Évolutions futures

- [ ] Chiffrement des mots de passe en base
- [ ] Stockage en base de données (Supabase) au lieu de fichier JSON
- [ ] Support de connexions SSL/TLS
- [ ] Monitoring des performances des connexions
- [ ] Alertes automatiques en cas d'échec de connexion
- [ ] Support de connexions multiples simultanées
- [ ] Export/Import des configurations

## 📚 Documentation supplémentaire

- [Guide de connexion JDBC Informix](./JDBC_INFORMIX_SETUP.md)
- [Architecture hybride MySQL + Informix](./ARCHITECTURE_HYBRIDE.md)
- [Backend Java Spring Boot](./backend-java/README.md)
