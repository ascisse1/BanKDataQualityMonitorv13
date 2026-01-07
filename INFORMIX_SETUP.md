# Configuration Informix - Guide d'installation

## ⚠️ Configuration des locales requise

Après l'installation du driver, vous **DEVEZ** configurer les variables d'environnement de locales pour correspondre au serveur AIX. Voir la section "Configuration des variables d'environnement" ci-dessous.

## Prérequis

Pour que l'application puisse se connecter à la base de données Informix, vous devez installer les drivers ODBC Informix sur votre système.

## Installation des drivers ODBC Informix

### Windows

1. **Télécharger IBM Informix Client SDK**
   - Visitez le site IBM: https://www.ibm.com/products/informix/tools
   - Téléchargez "IBM Informix Client SDK" pour Windows
   - Version recommandée: IBM Informix Client SDK 4.50 ou supérieur

2. **Installer le Client SDK**
   - Exécutez l'installateur téléchargé
   - Suivez les instructions d'installation
   - Notez le répertoire d'installation (généralement `C:\Program Files\IBM\Informix\Client-SDK`)

3. **Configurer les variables d'environnement**
   ```powershell
   # Ajouter au PATH système
   $env:PATH += ";C:\Program Files\IBM\Informix\Client-SDK\bin"
   $env:INFORMIXDIR = "C:\Program Files\IBM\Informix\Client-SDK"
   ```

## 🔧 Configuration des variables d'environnement

**CRITIQUE** : Cette étape est **OBLIGATOIRE** pour éviter l'erreur "Database locale information mismatch".

### Solution automatique (recommandée)

Exécutez le script PowerShell fourni :
```powershell
.\scripts\set_informix_env.ps1
```

### Solution manuelle

Configurez les variables dans PowerShell :
```powershell
$env:INFORMIXDIR = "C:\Program Files\Informix Client-SDK"
$env:PATH += ";$env:INFORMIXDIR\bin"
$env:DB_LOCALE = "en_US.819"       # Locale du serveur AIX
$env:CLIENT_LOCALE = "en_US.utf8"
$env:LANG = "en_US.utf8"
```

### Pourquoi ces variables sont nécessaires

- **INFORMIXDIR** : Indique où se trouvent les fichiers du client Informix
- **PATH** : Permet de trouver les exécutables ODBC et dbaccess
- **DB_LOCALE** : Doit correspondre à la locale du serveur (`en_US.819` pour votre serveur AIX)
- **CLIENT_LOCALE** : Locale du client Windows (`en_US.utf8`)
- **LANG** : Locale système utilisée par les outils Informix

**Note** : Ces variables doivent être configurées **dans chaque nouvelle session PowerShell** avant d'utiliser l'application.

### Configuration permanente (optionnel)

Pour éviter de réexécuter le script à chaque session, ajoutez les variables aux variables système Windows :
1. Panneau de configuration → Système → Paramètres système avancés
2. Variables d'environnement
3. Variables système → Nouveau
4. Ajoutez chaque variable avec sa valeur

4. **Configurer ODBC Data Source (DSN)**
   - Ouvrir "ODBC Data Sources (64-bit)" depuis le Panneau de configuration
   - Cliquer sur "Add" pour ajouter un nouveau DSN
   - Sélectionner "IBM INFORMIX ODBC DRIVER"
   - Configurer avec les paramètres suivants:
     - Data Source Name: `informix_bdmsa` ou `lcb`
     - Description: `BSIC Bank Database`
     - Host: `10.3.0.66`
     - Port: `1526`
     - Server Name: `ol_bdmsa` (⚠️ PAS `ol_bdmsa_tcp`)
     - Database Name: `bdmsa`
     - User ID: `bank`
     - Password: `bank`
   - Tester la connexion

### Linux

1. **Télécharger IBM Informix Client SDK**
   ```bash
   # Pour Ubuntu/Debian
   wget https://www-01.ibm.com/marketing/iwm/iwm/web/...

   # Décompresser
   tar -xzf clientsdk.tar.gz
   cd clientsdk
   ```

2. **Installer**
   ```bash
   sudo ./installclientsdk
   ```

3. **Configurer les variables d'environnement**
   ```bash
   # Ajouter à ~/.bashrc ou ~/.zshrc
   export INFORMIXDIR=/opt/IBM/Informix_Client-SDK
   export PATH=$INFORMIXDIR/bin:$PATH
   export LD_LIBRARY_PATH=$INFORMIXDIR/lib:$INFORMIXDIR/lib/esql:$LD_LIBRARY_PATH
   ```

4. **Configurer ODBC**
   Éditer `/etc/odbc.ini`:
   ```ini
   [informix_bdmsa]
   Description = BSIC Bank Database
   Driver = /opt/IBM/Informix_Client-SDK/lib/cli/iclit09b.so
   Database = bdmsa
   Servername = ol_bdmsa
   Protocol = onsoctcp
   Hostname = 10.3.0.66
   Service = 1526
   ```

## Configuration de l'application

### Option 1: Utiliser un DSN ODBC (Recommandé)

Si vous avez configuré un DSN ODBC (comme `lcb`), utilisez simplement le nom du DSN dans le fichier `.env`:

```env
# Type de base de données
DB_TYPE=informix

# Configuration Informix avec DSN
INFORMIX_DSN=lcb
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank
```

### Option 2: Configuration manuelle

Si vous n'avez pas de DSN, vous pouvez configurer manuellement les paramètres de connexion:

```env
# Type de base de données
DB_TYPE=informix

# Configuration Informix manuelle
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank
INFORMIX_SERVER=ol_bdmsa
INFORMIX_DATABASE=bdmsa
```

## Démarrer l'application

Une fois les drivers ODBC installés et configurés:

```bash
# Démarrer le serveur et le client
npm run dev:full
```

## Vérification de la connexion

Au démarrage, vous devriez voir dans les logs:

**Avec DSN:**
```
🔄 Mode: PRODUCTION (base de données réelle)
📊 Database Type: INFORMIX
🔗 Creating Informix ODBC connection pool...
   Using DSN: lcb
   DSN: lcb
   User: bank
✅ Informix connection pool created successfully
```

**Sans DSN (configuration manuelle):**
```
🔄 Mode: PRODUCTION (base de données réelle)
📊 Database Type: INFORMIX
🔗 Creating Informix ODBC connection pool...
   Host: 10.3.0.66:1526
   Server: ol_bdmsa
   Database: bdmsa
   User: bank
✅ Informix connection pool created successfully
```

## Dépannage

### Erreur: "Driver not found"

**Cause:** Le driver ODBC Informix n'est pas installé ou n'est pas dans le PATH

**Solution:**
1. Vérifier que IBM Informix Client SDK est installé
2. Vérifier les variables d'environnement `INFORMIXDIR` et `PATH`
3. Redémarrer le terminal/IDE après avoir modifié les variables d'environnement

### Erreur: "Connection refused"

**Cause:** Le serveur Informix n'est pas accessible

**Solution:**
1. Vérifier que le serveur Informix est en ligne: `10.3.0.66:1526`
2. Vérifier la configuration réseau et le pare-feu
3. Tester avec `ping 10.3.0.66`

### Erreur: "Authentication failed"

**Cause:** Identifiants incorrects

**Solution:**
1. Vérifier les identifiants dans `.env`
2. Vérifier que l'utilisateur `bank` a les permissions nécessaires dans Informix

## Alternative: Connexion MySQL

Si vous ne pouvez pas installer les drivers Informix, l'application peut toujours utiliser MySQL:

1. Modifier `.env`:
   ```env
   DB_TYPE=mysql
   ```

2. Configurer MySQL selon le guide `MYSQL_SETUP.md`

## Support

Pour plus d'informations sur IBM Informix Client SDK:
- Documentation: https://www.ibm.com/docs/en/informix-servers
- Forum: https://community.ibm.com/community/user/datamanagement/communities/community-home?CommunityKey=cf5a1f39-c21f-4bc4-9ec2-7ca108f0a365
