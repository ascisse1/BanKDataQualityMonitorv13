# Résolution de l'erreur Informix -23101

## 🔴 Erreur rencontrée

```
[Informix][Informix ODBC Driver][Informix]Unspecified System Error = -23101
State: HY000
Code: -23101
```

## 📊 Diagnostic

Cette erreur indique que la configuration des locales est correcte, mais il y a un problème de connexion au serveur Informix.

### Exécuter le diagnostic rapide (RECOMMANDÉ)

```powershell
# Vérification rapide du DSN et de la connectivité
.\scripts\quick-dsn-check.ps1
```

Ce script va :
- Vérifier que le DSN existe et afficher sa configuration
- Tester la connectivité réseau (ping)
- Tester l'accessibilité du port Informix (1526)
- Vous indiquer exactement quoi corriger

### Ou exécuter le diagnostic complet

```powershell
# 1. Configurer l'environnement
.\scripts\set_informix_env.ps1

# 2. Lancer le diagnostic
npm run diagnose:informix
```

Ce script va tester plusieurs configurations de connexion et vous indiquer laquelle fonctionne.

## 🔍 Causes possibles

### 1️⃣ Configuration incorrecte du DSN

Le paramètre **Server Name** dans le DSN doit être exact.

**Vérification** :
```powershell
odbcad32.exe
```

Dans la configuration du DSN "lcb", vérifiez :
- **Server Name** : `ol_bdmsa` (⚠️ PAS `ol_bdmsa_tcp`)
- **Host** : `10.3.0.66`
- **Service** : `1526`
- **Protocol** : `onsoctcp`
- **Database Name** : `bdmsa`

**Correction** :
1. Sélectionnez le DSN "lcb"
2. Cliquez sur "Configure"
3. Modifiez **Server Name** pour avoir exactement : `ol_bdmsa`
4. Testez la connexion dans l'interface ODBC
5. Si le test réussit, cliquez sur "OK"

### 2️⃣ Serveur Informix non accessible

Le serveur AIX peut être éteint ou inaccessible depuis votre réseau.

**Vérification** :
```powershell
# Test de connectivité réseau
ping 10.3.0.66

# Test du port
Test-NetConnection -ComputerName 10.3.0.66 -Port 1526
```

**Résultat attendu** :
- Le ping doit répondre
- Le port 1526 doit être ouvert

### 3️⃣ Serveur Informix non démarré (côté AIX)

Sur le serveur AIX, vérifiez que le serveur Informix est démarré.

**Vérification côté AIX** :
```bash
# Se connecter au serveur AIX
ssh user@10.3.0.66

# Vérifier le statut d'Informix
onstat -

# Le résultat doit afficher "On-Line"
```

**Si le serveur est arrêté** :
```bash
# Démarrer Informix (en tant qu'utilisateur informix)
oninit
```

### 4️⃣ Nom du serveur incorrect

Le nom du serveur dans le DSN doit correspondre au nom réel du serveur Informix sur AIX.

**Vérification côté AIX** :
```bash
# Afficher le nom du serveur
echo $INFORMIXSERVER

# Ou vérifier dans le fichier sqlhosts
cat $INFORMIXDIR/etc/sqlhosts | grep ol_bdmsa
```

Le résultat devrait être :
```
ol_bdmsa    onsoctcp    10.3.0.66    1526
```

### 5️⃣ Firewall bloquant la connexion

Un firewall peut bloquer le port 1526.

**Vérification Windows** :
```powershell
# Vérifier les règles de pare-feu pour le port 1526
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*1526*"}
```

**Vérification côté AIX** :
```bash
# Vérifier que le port est à l'écoute
netstat -an | grep 1526
```

### 6️⃣ Permissions utilisateur insuffisantes

L'utilisateur "bank" peut ne pas avoir les permissions nécessaires.

**Vérification côté AIX** :
```bash
# Se connecter à Informix avec dbaccess
dbaccess bdmsa

# Essayer une requête simple
SELECT FIRST 1 * FROM systables;
```

Si cette requête échoue, c'est un problème de permissions.

## ✅ Solutions étape par étape

### Solution 1 : Corriger le Server Name du DSN

C'est la cause la plus fréquente de l'erreur -23101.

1. Ouvrir l'administrateur ODBC :
   ```powershell
   odbcad32.exe
   ```

2. Sélectionner le DSN "lcb" et cliquer sur "Configure"

3. Dans le champ **Server Name**, remplacer :
   - Valeur actuelle : `ol_bdmsa_tcp` ou autre
   - Valeur correcte : `ol_bdmsa`

4. Cliquer sur "Test Connection"

5. Si le test réussit, enregistrer avec "OK"

6. Retester l'application :
   ```powershell
   .\scripts\set_informix_env.ps1
   npm run diagnose:informix
   ```

### Solution 2 : Vérifier la connectivité réseau

```powershell
# Test ping
ping 10.3.0.66

# Test port (PowerShell 5+)
Test-NetConnection -ComputerName 10.3.0.66 -Port 1526
```

Si le ping échoue ou le port est fermé, contactez votre administrateur réseau.

### Solution 3 : Créer un nouveau DSN

Si le DSN "lcb" est corrompu, recréez-le :

1. Ouvrir l'administrateur ODBC :
   ```powershell
   odbcad32.exe
   ```

2. Cliquer sur "Add" (System DSN)

3. Sélectionner "IBM INFORMIX ODBC DRIVER" ou "Informix"

4. Configurer avec ces paramètres exacts :
   - **Data Source Name** : `lcb_test`
   - **Description** : `BSIC Bank Database Test`
   - **Host** : `10.3.0.66`
   - **Service** : `1526`
   - **Server Name** : `ol_bdmsa` (⚠️ CRITIQUE)
   - **Protocol** : `onsoctcp`
   - **Database Name** : `bdmsa`
   - **User ID** : `bank`
   - **Password** : `bank`

5. Cliquer sur "Test Connection"

6. Si le test réussit, modifier `.env` :
   ```env
   INFORMIX_DSN=lcb_test
   ```

7. Relancer le diagnostic :
   ```powershell
   npm run diagnose:informix
   ```

### Solution 4 : Vérifier côté serveur AIX

Contactez l'administrateur du serveur AIX pour vérifier :

1. Le serveur Informix est démarré :
   ```bash
   onstat -
   ```

2. Le nom du serveur est correct :
   ```bash
   echo $INFORMIXSERVER
   cat $INFORMIXDIR/etc/sqlhosts | grep ol_bdmsa
   ```

3. Le port est à l'écoute :
   ```bash
   netstat -an | grep 1526
   ```

4. L'utilisateur "bank" a les permissions :
   ```bash
   dbaccess bdmsa
   SELECT FIRST 1 * FROM systables;
   ```

## 📋 Checklist de dépannage

- [ ] Variables d'environnement configurées (`.\scripts\set_informix_env.ps1`)
- [ ] DSN "lcb" existe dans odbcad32.exe
- [ ] Server Name = `ol_bdmsa` (sans _tcp)
- [ ] Host = `10.3.0.66`
- [ ] Service = `1526`
- [ ] Protocol = `onsoctcp`
- [ ] Database Name = `bdmsa`
- [ ] Test de connexion réussi dans l'administrateur ODBC
- [ ] Ping vers 10.3.0.66 fonctionne
- [ ] Port 1526 est accessible
- [ ] Serveur Informix est démarré (onstat - = On-Line)
- [ ] Diagnostic complet exécuté (`npm run diagnose:informix`)

## 🎯 Prochaines étapes

Une fois l'erreur résolue :

1. Vérifier que le diagnostic réussit :
   ```powershell
   npm run diagnose:informix
   ```

2. Tester la connexion DSN :
   ```powershell
   npm run test:dsn
   ```

3. Lancer l'application :
   ```powershell
   npm run dev:full
   ```

## 📞 Besoin d'aide ?

Si aucune de ces solutions ne fonctionne :

1. Exécutez le diagnostic complet et sauvegardez la sortie :
   ```powershell
   npm run diagnose:informix > diagnostic.txt
   ```

2. Contactez l'administrateur du serveur AIX avec :
   - Le fichier `diagnostic.txt`
   - La configuration de votre DSN (capture d'écran)
   - Les résultats des tests ping et port

## 📚 Ressources

- **Configuration des locales** : `LOCALE_MISMATCH_SOLUTION.md`
- **Configuration DSN** : `DSN_CONNECTION_GUIDE.md`
- **Installation Informix** : `INFORMIX_SETUP.md`
- **Documentation IBM** : https://www.ibm.com/docs/en/informix-servers
