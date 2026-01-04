# Guide de connexion Informix avec DSN

## ⚠️ IMPORTANT : DSN OBLIGATOIRE

Sur Windows, **node-odbc ne supporte pas correctement les connexions manuelles avec Informix**.

**Vous DEVEZ utiliser un DSN ODBC. Les connexions manuelles (DRIVER=...) ne fonctionnent pas.**

## ✅ Ce qui a été configuré

L'application a été modifiée pour utiliser **EXCLUSIVEMENT** le DSN ODBC.

### Modifications effectuées :

1. **Fichier `.env`** : Configuration du DSN
   ```env
   INFORMIX_DSN=lcb
   INFORMIX_USER=bank
   INFORMIX_PASSWORD=bank
   ```

2. **Fichier `server/informixDatabase.js`** : DSN obligatoire
   - La fonction `buildConnectionString()` utilise **UNIQUEMENT** le DSN
   - Les connexions manuelles sont désactivées (ne fonctionnent pas sur Windows)

3. **Fichier `functions/server/informixDatabase.js`** : Même modification pour Netlify

4. **Scripts de test** :
   - `test-dsn-connection.js` : Test avec DSN
   - `test-manual-connection.js` : Confirme que la méthode manuelle ne fonctionne pas

## 🔧 Configuration requise AVANT la connexion

### 1️⃣ Configurer les variables d'environnement Windows

**CRITIQUE** : Les locales Windows doivent correspondre au serveur AIX pour éviter l'erreur "Database locale information mismatch".

Exécutez le script PowerShell fourni :
```powershell
.\scripts\set_informix_env.ps1
```

Ce script configure automatiquement :
- `INFORMIXDIR` : Chemin du Client SDK Informix
- `PATH` : Ajout du répertoire bin
- `DB_LOCALE` : `en_US.819` (locale du serveur AIX)
- `CLIENT_LOCALE` : `en_US.utf8`
- `LANG` : `en_US.utf8`

**Alternative** : Configuration manuelle dans PowerShell :
```powershell
$env:INFORMIXDIR = "C:\Program Files\Informix Client-SDK"
$env:PATH += ";$env:INFORMIXDIR\bin"
$env:DB_LOCALE = "en_US.819"
$env:CLIENT_LOCALE = "en_US.utf8"
$env:LANG = "en_US.utf8"
```

### 2️⃣ Vérifier/Corriger le DSN "lcb"

Votre DSN "lcb" peut nécessiter une correction :
- **Server Name actuel** : `ol_bdmsa_tcp` ❌
- **Server Name correct** : `ol_bdmsa` ✅

### Étapes pour corriger le DSN :

1. **Ouvrir la configuration ODBC** :
   ```powershell
   odbcad32.exe
   ```

2. **Modifier le DSN "lcb"** :
   - Sélectionnez le DSN **"lcb"** dans l'onglet "System DSN"
   - Cliquez sur **"Configure"**
   - Dans le champ **"Server Name"**, changez :
     - De : `ol_bdmsa_tcp`
     - À : `ol_bdmsa` (sans le suffixe `_tcp`)
   - Cliquez sur **"Test Connection"** pour vérifier
   - Si le test réussit, cliquez sur **"OK"** pour enregistrer

3. **Vérifier les autres paramètres du DSN** :
   - Host name: `10.3.0.66`
   - Service: `1526`
   - Protocol: `onsoctcp`
   - Database Name: `bdmsa`
   - User Id: `bank`
   - Password: `bank`

## 🚀 Comment tester

### Étape 1 : Configurer l'environnement

**OBLIGATOIRE** avant tout test :
```powershell
.\scripts\set_informix_env.ps1
```

### Étape 2 : Tester la connexion

#### Option A : Test avec DSN (recommandé)

```powershell
npm run test:dsn
```

Ce script va :
- Charger le module ODBC
- Se connecter au DSN "lcb"
- Exécuter une requête de test
- Afficher les 5 premières tables de la base

**Résultat attendu :**
```
✅ Module ODBC chargé avec succès
✅ Pool créé avec succès
✅ Requête exécutée avec succès
📊 Tables trouvées:
  1. table1
  2. table2
  ...
🎉 TEST RÉUSSI ! La connexion Informix fonctionne correctement.
```

#### Option B : Test avec connexion manuelle

```powershell
npm run test:manual
```

### Étape 3 : Lancer l'application

Une fois les tests réussis :
```powershell
npm run dev:full
```

**IMPORTANT** : Les variables d'environnement doivent être configurées dans **chaque nouvelle session PowerShell** avant de lancer l'application.

**Logs attendus au démarrage :**
```
🔄 Mode: PRODUCTION (base de données réelle)
📊 Database Type: INFORMIX
🔗 Creating Informix ODBC connection pool...
   Using DSN: lcb
   DSN: lcb
   User: bank
✅ Informix connection pool created successfully
```

## 🔧 Dépannage

### Erreur : "Database locale information mismatch"

Consultez le guide dédié : `LOCALE_MISMATCH_SOLUTION.md`

Solution rapide :
```powershell
.\scripts\set_informix_env.ps1
```

### Erreur : -23101 "Unspecified System Error"

Consultez le guide dédié : `INFORMIX_ERROR_23101.md`

Solution rapide :
```powershell
# Vérifier la configuration du DSN
.\scripts\check-dsn-config.ps1

# Diagnostic complet
npm run diagnose:informix
```

### Si le test échoue

1. **Vérifier le DSN** :
   ```powershell
   # Afficher la configuration du DSN
   .\scripts\check-dsn-config.ps1

   # Ouvrir la configuration ODBC
   odbcad32.exe
   ```
   - Vérifier que le DSN "lcb" existe
   - Vérifier qu'il pointe vers le bon serveur
   - Tester la connexion dans l'interface ODBC

2. **Vérifier les identifiants** dans `.env` :
   ```env
   INFORMIX_USER=bank
   INFORMIX_PASSWORD=bank
   ```

3. **Vérifier la connectivité réseau** :
   ```powershell
   ping 10.3.0.66
   ```

### Si vous voulez utiliser un autre DSN :

Modifiez `.env` :
```env
INFORMIX_DSN=votre_dsn
INFORMIX_USER=votre_user
INFORMIX_PASSWORD=votre_password
```

### ⚠️ Connexion manuelle NON supportée

**IMPORTANT** : Les connexions manuelles (sans DSN) ne fonctionnent pas avec node-odbc sur Windows.

Si vous supprimez `INFORMIX_DSN` du fichier `.env`, l'application affichera une erreur :
```
DSN ODBC requis pour Informix sur Windows.
Configurez INFORMIX_DSN dans .env
```

**Vous DEVEZ utiliser un DSN ODBC.**

## 📚 Documentation

- **Guide complet** : Voir `INFORMIX_SETUP.md`
- **Structure hybride** : Voir `ARCHITECTURE_HYBRIDE.md`
- **Migration MySQL** : Voir `MYSQL_MIGRATION_GUIDE.md`

## ✨ Avantages du DSN

1. **Simplicité** : Pas besoin de spécifier host, port, server, database
2. **Maintenance** : Changez la configuration ODBC sans toucher au code
3. **Sécurité** : Les détails de connexion sont dans Windows, pas dans le code
4. **Fiabilité** : Le DSN "lcb" a été testé et fonctionne

## 🎯 Prochaines étapes

1. **Tester la connexion** : `npm run test:dsn`
2. **Lancer l'application** : `npm run dev:full`
3. **Charger vos données** : Utilisez l'interface de chargement de fichiers CSV
4. **Profiter** : Votre application est maintenant connectée à Informix !
