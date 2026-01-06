# 🚀 Démarrer l'Application MAINTENANT

## ✅ État Après Nettoyage

- ✅ Build frontend réussi (29.54s)
- ✅ ODBC complètement désactivé
- ✅ Configuration JDBC corrigée (locale fr_FR.819)
- ✅ 46 fichiers inutiles supprimés
- ✅ Architecture simplifiée
- ✅ Documentation centralisée

---

## ⚡ Démarrage Rapide

### Option 1 : Sans Informix (Recommandé pour tester)

**1. Désactiver Informix temporairement**

Éditer `backend-java/src/main/resources/application-local.yml` :
```yaml
app:
  features:
    informix-integration: false  # Changer true → false
```

**2. Démarrer**

Terminal 1 - Backend Java:
```powershell
cd backend-java
mvn spring-boot:run -DskipTests
```

Terminal 2 - Frontend:
```powershell
npm run dev
```

**3. Accéder**
- Frontend: http://localhost:5174
- Backend: http://localhost:8080
- Login: admin@bsic.sn / admin

---

### Option 2 : Avec Informix (Nécessite configuration)

**1. Vérifier/Ajuster la locale Informix**

Si erreur "Database locale mismatch", essayer dans cet ordre :

**Essai 1 (déjà configuré):**
```yaml
# backend-java/src/main/resources/application-local.yml
jdbc-url: jdbc:informix-sqli://10.3.0.66:1526/bdmsa:INFORMIXSERVER=ol_bdmsa;DELIMIDENT=Y;DB_LOCALE=fr_FR.819;CLIENT_LOCALE=fr_FR.819
```

**Essai 2:**
```yaml
jdbc-url: ...;DB_LOCALE=en_US.819;CLIENT_LOCALE=en_US.819
```

**Essai 3:**
```yaml
jdbc-url: ...;DB_LOCALE=fr_FR.utf8;CLIENT_LOCALE=fr_FR.utf8
```

**2. Activer Informix**
```yaml
app:
  features:
    informix-integration: true
```

**3. Démarrer**
```powershell
# Terminal 1
cd backend-java
mvn spring-boot:run -DskipTests

# Terminal 2
npm run dev
```

---

## 🔧 Résolution Problèmes

### Erreur: Port 8080 occupé
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Erreur: Database locale mismatch

**Identifier la locale du serveur Informix:**
```bash
# Sur le serveur AIX Informix
onstat -g nls
```

Chercher les lignes `DB_LOCALE` et `CLIENT_LOCALE` puis ajuster dans `application-local.yml`.

### Backend ne démarre pas

1. Vérifier Java : `java -version` (doit être 17+)
2. Vérifier MySQL : `mysql -u root -p`
3. Utiliser Option 1 (sans Informix) pour tester

---

## 📊 Ce qui a changé

### Architecture Simplifiée

**Avant:**
```
Frontend → Node.js (ODBC) → Informix
              ↓
           MySQL
```

**Maintenant:**
```
Frontend → Backend Java (JDBC) → Informix
                ↓
             MySQL
```

### Fichiers Nettoyés

- ✅ 11 scripts ODBC supprimés
- ✅ 27 fichiers documentation obsolètes supprimés
- ✅ 8 fichiers/dossiers serveur redondants supprimés
- ✅ 1 README.md clair et concis

### Connexion Informix

- ❌ ODBC désactivé (déprécié, problématique)
- ✅ JDBC uniquement (moderne, fiable)
- ✅ Mode dégradé automatique
- ✅ Logs clairs

---

## 📚 Documentation

### Fichier Principal
**README.md** - Tout ce dont vous avez besoin :
- Installation
- Configuration
- Troubleshooting
- API endpoints
- Structure projet

### Fichiers Utiles
- **NETTOYAGE_COMPLET.md** - Détails du nettoyage effectué
- **DEMARRAGE_MAINTENANT.md** - Ce fichier
- **backend-java/README.md** - Documentation backend

---

## ✅ Checklist de Démarrage

- [ ] Java 17+ installé : `java -version`
- [ ] Maven installé : `mvn --version`
- [ ] Node.js installé : `node --version`
- [ ] MySQL accessible : `mysql -u root -p`
- [ ] Port 8080 libre
- [ ] Port 5174 libre
- [ ] Fichier `.env` configuré
- [ ] Base `bank_data_quality` créée dans MySQL

---

## 🎯 URLs de l'Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5174 | admin@bsic.sn / admin |
| Backend API | http://localhost:8080 | - |
| Camunda | http://localhost:8080/camunda | admin / admin |
| Health Check | http://localhost:8080/actuator/health | - |

---

## 🎉 Prêt à Démarrer !

**Commande rapide (sans Informix):**
```powershell
# Terminal 1
cd backend-java
mvn spring-boot:run -Dapp.features.informix-integration=false

# Terminal 2
npm run dev
```

**Si tout fonctionne:**
1. ✅ Backend démarre sans erreur sur port 8080
2. ✅ Frontend accessible sur port 5174
3. ✅ Login fonctionne avec admin@bsic.sn / admin
4. ✅ Dashboard affiche les données

**Ensuite:** Activer Informix si disponible (voir Option 2)

---

**Dernière mise à jour:** 2026-01-05
**Version:** 13.0.0 (nettoyée)
