# ⚡ Démarrage Rapide - 5 minutes !

## 🎯 Objectif

Lancer votre application **BSIC Data Quality Monitor v2.0** en moins de 5 minutes.

---

## ✅ Prérequis

Vérifiez que vous avez :

- ✅ **Java 17+** installé (`java -version`)
- ✅ **Maven 3.8+** installé (`mvn -version`)
- ✅ **Node.js 18+** installé (`node -version`)
- ✅ **npm 9+** installé (`npm -version`)

---

## 🚀 3 étapes simples

### 1️⃣ Configuration (30 secondes)

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Ouvrir .env et vérifier que cette ligne existe :
# VITE_API_BASE_URL=http://localhost:8080/api

# C'est tout ! Supabase est déjà configuré ✅
```

### 2️⃣ Backend Java (2 minutes)

```bash
# Aller dans le dossier backend
cd backend-java

# Installer et démarrer (en une commande)
mvn clean spring-boot:run

# ✅ Attendez le message : "Started DataQualityBackendApplication"
# ✅ Backend disponible sur http://localhost:8080
```

**Laissez ce terminal ouvert !**

### 3️⃣ Frontend React (1 minute)

```bash
# Ouvrir un NOUVEAU terminal
# Aller à la racine du projet
cd ..

# Installer les dépendances (première fois seulement)
npm install

# Démarrer le frontend
npm run dev

# ✅ Frontend disponible sur http://localhost:5173
```

---

## 🎉 C'est fini !

### Accéder à l'application

Ouvrez votre navigateur : **http://localhost:5173**

### Connexion

**Compte Admin :**
- 👤 Username : `admin`
- 🔑 Password : `admin`

---

## 📊 Que faire ensuite ?

### Explorer le Dashboard
1. Connectez-vous avec admin/admin
2. Explorez le tableau de bord
3. Consultez les anomalies
4. Vérifiez les stats FATCA

### Tester l'upload
1. Allez dans "Upload"
2. Glissez-déposez un fichier CSV/Excel
3. Vérifiez le traitement

### Créer un ticket
1. Allez dans "Tickets"
2. Créez un nouveau ticket
3. Testez les commentaires

---

## 🐛 Problème ?

### Backend ne démarre pas ?

**Erreur : "Port 8080 already in use"**
```bash
# Trouver et arrêter le processus
netstat -ano | findstr :8080
# Puis tuer le processus avec le PID affiché
```

**Erreur : "Cannot connect to database"**
```bash
# Vérifier .env
# S'assurer que les credentials Supabase sont corrects
# Déjà configurés dans .env : ✅
```

### Frontend ne se connecte pas ?

**Erreur : "Network Error"**
```bash
# 1. Vérifier que le backend est démarré (http://localhost:8080/actuator/health)
# 2. Vérifier VITE_API_BASE_URL dans .env
# 3. Redémarrer le frontend (Ctrl+C puis npm run dev)
```

**Page blanche**
```bash
# Vider le cache navigateur
# Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
```

---

## 📱 Accès rapide

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | admin / admin |
| **Backend API** | http://localhost:8080/api | - |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | - |
| **Health Check** | http://localhost:8080/actuator/health | - |
| **Supabase** | https://etvrnjuzerotpmngcpty.supabase.co | Déjà configuré |

---

## 🔥 Commandes utiles

### Redémarrer backend
```bash
# Ctrl+C dans le terminal backend puis :
mvn spring-boot:run
```

### Redémarrer frontend
```bash
# Ctrl+C dans le terminal frontend puis :
npm run dev
```

### Build production
```bash
# Frontend
npm run build

# Backend
cd backend-java
mvn clean package
# JAR dans : target/data-quality-backend-0.0.1-SNAPSHOT.jar
```

### Logs backend
```bash
# Logs en temps réel
tail -f backend-java/logs/application.log
```

---

## 🎯 Checklist de démarrage

- [ ] Java 17+ installé ✅
- [ ] Maven installé ✅
- [ ] Node.js 18+ installé ✅
- [ ] Fichier `.env` configuré ✅
- [ ] Backend démarré (port 8080) ✅
- [ ] Frontend démarré (port 5173) ✅
- [ ] Connexion réussie avec admin/admin ✅
- [ ] Dashboard visible ✅

---

## 📚 Documentation complète

Pour aller plus loin :

- **Guide complet** : `APPLICATION_COMPLETE_V2.md`
- **Améliorations** : `AMELIORATIONS_RECOMMANDEES.md`
- **Migration** : `BACKEND_JAVA_MIGRATION_COMPLETE.md`
- **Backend Java** : `backend-java/QUICK_START.md`

---

## 🎊 Félicitations !

Votre application est lancée ! 🚀

**Prochaines étapes recommandées :**
1. Explorer toutes les fonctionnalités
2. Tester l'upload de fichiers
3. Créer quelques anomalies
4. Consulter les statistiques
5. Lire `AMELIORATIONS_RECOMMANDEES.md`

---

**Besoin d'aide ?** Consultez `APPLICATION_COMPLETE_V2.md` pour plus de détails.

**Version** : 2.0.0 | **Date** : 2025-01-04 | **Status** : ✅ Ready
