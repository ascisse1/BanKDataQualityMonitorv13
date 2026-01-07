# Guide de dépannage Informix - Vue d'ensemble

Ce guide regroupe tous les outils et ressources pour diagnostiquer et résoudre les problèmes de connexion à Informix.

## 🚀 Démarrage rapide

Pour connecter votre application à Informix, suivez ces étapes :

### 1. Configurer l'environnement
```powershell
.\scripts\set_informix_env.ps1
```

### 2. Vérifier la configuration du DSN
```powershell
.\scripts\check-dsn-config.ps1
```

### 3. Exécuter le diagnostic complet
```powershell
npm run diagnose:informix
```

### 4. Tester la connexion
```powershell
npm run test:dsn
```

### 5. Lancer l'application
```powershell
npm run dev:full
```

## 🛠️ Outils de diagnostic

### Scripts PowerShell

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `set_informix_env.ps1` | Configure les variables d'environnement de locales | `.\scripts\set_informix_env.ps1` |
| `check-dsn-config.ps1` | Affiche la configuration du DSN depuis le registre | `.\scripts\check-dsn-config.ps1` |

### Scripts Node.js

| Commande npm | Description |
|--------------|-------------|
| `npm run diagnose:informix` | Diagnostic complet - teste plusieurs configurations |
| `npm run test:dsn` | Test simple avec le DSN configuré |
| `npm run test:manual` | Test avec connexion manuelle (non recommandé sur Windows) |

## 📚 Guides de résolution par erreur

### Erreur : "Database locale information mismatch"

**Symptôme** : Erreur lors de la connexion indiquant un mismatch de locales

**Guide** : `LOCALE_MISMATCH_SOLUTION.md`

**Solution rapide** :
```powershell
.\scripts\set_informix_env.ps1
npm run test:dsn
```

### Erreur : -23101 "Unspecified System Error"

**Symptôme** : Erreur système non spécifiée, généralement après avoir résolu le problème de locales

**Guide** : `INFORMIX_ERROR_23101.md`

**Solution rapide** :
```powershell
# Vérifier la configuration du DSN
.\scripts\check-dsn-config.ps1

# Diagnostic complet
npm run diagnose:informix

# Corriger le Server Name dans odbcad32.exe si nécessaire
odbcad32.exe
```

**Cause la plus fréquente** : Server Name incorrect dans le DSN (doit être `ol_bdmsa`, pas `ol_bdmsa_tcp`)

## 🔍 Checklist de dépannage

Cochez chaque élément au fur et à mesure :

### Configuration de base
- [ ] Informix Client SDK installé
- [ ] Variables d'environnement configurées (`set_informix_env.ps1` exécuté)
- [ ] DSN "lcb" créé dans odbcad32.exe

### Configuration du DSN
- [ ] Server Name = `ol_bdmsa` (sans _tcp)
- [ ] Host = `10.3.0.66`
- [ ] Service = `1526`
- [ ] Protocol = `onsoctcp`
- [ ] Database Name = `bdmsa`
- [ ] User ID = `bank`
- [ ] Password = `bank`

### Tests de connectivité
- [ ] Ping vers 10.3.0.66 réussit
- [ ] Port 1526 accessible
- [ ] Test de connexion dans odbcad32.exe réussit
- [ ] `npm run diagnose:informix` réussit
- [ ] `npm run test:dsn` réussit

### Serveur AIX
- [ ] Serveur Informix démarré (`onstat -` = "On-Line")
- [ ] Nom du serveur vérifié (`echo $INFORMIXSERVER`)
- [ ] Port à l'écoute (`netstat -an | grep 1526`)
- [ ] Permissions utilisateur OK (`dbaccess bdmsa`)

## 🎯 Arbre de décision

```
┌─────────────────────────────────┐
│ Exécuter set_informix_env.ps1   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    npm run diagnose:informix    │
└────────────┬────────────────────┘
             │
        ┌────┴─────┐
        │          │
    SUCCESS     FAILURE
        │          │
        │          ▼
        │    ┌─────────────────────────────┐
        │    │ Erreur "locale mismatch" ?  │
        │    └────┬──────────────────┬─────┘
        │         │                  │
        │        OUI                NON
        │         │                  │
        │         ▼                  ▼
        │    LOCALE_MISMATCH   ┌──────────────────┐
        │    _SOLUTION.md      │  Erreur -23101?  │
        │                      └────┬──────┬──────┘
        │                           │      │
        │                          OUI    NON
        │                           │      │
        │                           ▼      ▼
        │                    INFORMIX_  Autre erreur
        │                    ERROR_    (voir guides)
        │                    23101.md
        │
        ▼
┌─────────────────────────────────┐
│      npm run dev:full           │
└─────────────────────────────────┘
```

## 📞 Besoin d'aide supplémentaire ?

### Informations à collecter pour le support

Si vous devez contacter le support, préparez ces informations :

1. **Sortie du diagnostic complet** :
   ```powershell
   npm run diagnose:informix > diagnostic.txt
   ```

2. **Configuration du DSN** :
   ```powershell
   .\scripts\check-dsn-config.ps1 > dsn-config.txt
   ```

3. **Variables d'environnement** :
   ```powershell
   echo "INFORMIXDIR=$env:INFORMIXDIR" > env-vars.txt
   echo "DB_LOCALE=$env:DB_LOCALE" >> env-vars.txt
   echo "CLIENT_LOCALE=$env:CLIENT_LOCALE" >> env-vars.txt
   echo "LANG=$env:LANG" >> env-vars.txt
   ```

4. **Capture d'écran de la configuration DSN** dans odbcad32.exe

5. **Test de connectivité réseau** :
   ```powershell
   ping 10.3.0.66 > network-test.txt
   Test-NetConnection -ComputerName 10.3.0.66 -Port 1526 >> network-test.txt
   ```

## 📖 Documentation complète

| Document | Description |
|----------|-------------|
| `INFORMIX_SETUP.md` | Guide d'installation complet du Client SDK Informix |
| `DSN_CONNECTION_GUIDE.md` | Guide de configuration et utilisation du DSN |
| `LOCALE_MISMATCH_SOLUTION.md` | Résolution de l'erreur de mismatch de locales |
| `INFORMIX_ERROR_23101.md` | Résolution de l'erreur système -23101 |
| `ARCHITECTURE_HYBRIDE.md` | Architecture hybride MySQL + Informix |

## 🔄 Workflow complet de dépannage

### Première connexion

```powershell
# 1. Installer Informix Client SDK (une seule fois)
# Télécharger depuis IBM et installer

# 2. Créer le DSN (une seule fois)
odbcad32.exe

# 3. Configurer l'environnement (à chaque session PowerShell)
.\scripts\set_informix_env.ps1

# 4. Vérifier la configuration
.\scripts\check-dsn-config.ps1

# 5. Diagnostic complet
npm run diagnose:informix

# 6. Si tout est OK, lancer l'application
npm run dev:full
```

### Sessions suivantes

```powershell
# 1. Configurer l'environnement (nécessaire à chaque nouvelle session)
.\scripts\set_informix_env.ps1

# 2. Lancer l'application
npm run dev:full
```

### En cas de problème

```powershell
# 1. Configurer l'environnement
.\scripts\set_informix_env.ps1

# 2. Vérifier la configuration du DSN
.\scripts\check-dsn-config.ps1

# 3. Diagnostic complet
npm run diagnose:informix

# 4. Consulter le guide approprié selon l'erreur
# - LOCALE_MISMATCH_SOLUTION.md
# - INFORMIX_ERROR_23101.md
```

## ✨ Conseils pro

1. **Configuration permanente** : Pour éviter d'exécuter `set_informix_env.ps1` à chaque session, ajoutez les variables d'environnement dans les variables système Windows (voir `INFORMIX_SETUP.md`)

2. **Test rapide** : Avant de lancer l'application complète, utilisez toujours `npm run diagnose:informix` pour vérifier que tout fonctionne

3. **DSN de test** : Si vous modifiez la configuration du DSN, créez d'abord un nouveau DSN de test pour ne pas casser l'existant

4. **Logs détaillés** : Sauvegardez les sorties des scripts de diagnostic pour référence future

5. **Réseau** : Si vous travaillez depuis un VPN ou un réseau distant, assurez-vous que les ports nécessaires sont ouverts

## 🎓 Comprendre les erreurs courantes

| Erreur | Signification | Solution rapide |
|--------|---------------|-----------------|
| `locale information mismatch` | Les locales client ne correspondent pas au serveur | `.\scripts\set_informix_env.ps1` |
| `-23101` | Erreur système, souvent configuration DSN | Vérifier Server Name dans odbcad32.exe |
| `Connection refused` | Serveur inaccessible | Vérifier réseau et serveur AIX |
| `Driver not found` | Driver ODBC non installé | Installer Informix Client SDK |
| `Authentication failed` | Identifiants incorrects | Vérifier user/password dans .env |

## 📊 Récapitulatif des commandes

```powershell
# Configuration
.\scripts\set_informix_env.ps1           # Configurer les variables d'environnement
.\scripts\check-dsn-config.ps1           # Vérifier la configuration du DSN
odbcad32.exe                             # Ouvrir l'administrateur ODBC

# Tests
npm run diagnose:informix                # Diagnostic complet
npm run test:dsn                         # Test simple DSN
npm run test:manual                      # Test connexion manuelle

# Application
npm run dev:full                         # Lancer l'application complète
npm run server                           # Lancer uniquement le backend
```

---

**💡 Conseil** : Bookmarkez ce document pour un accès rapide aux outils de diagnostic !
