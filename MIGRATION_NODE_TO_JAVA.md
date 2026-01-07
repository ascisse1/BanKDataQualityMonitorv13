# Migration Backend Node.js Express → Java Spring Boot

## 📊 Analyse de l'Architecture Actuelle

### État actuel : Architecture Double Backend

```
┌─────────────────────────────────────┐
│   FRONTEND REACT                    │
│   Port: 5174                        │
│   - Interface utilisateur           │
│   - Tableaux de bord                │
│   - Graphiques & KPIs               │
└─────────┬───────────────────────────┘
          │
          ├─────────────────┬─────────────────────┐
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│ BACKEND NODE.JS │  │ BACKEND JAVA    │  │  SUPABASE    │
│  Port: 3001     │  │  Port: 8080     │  │  Cloud DB    │
│                 │  │                 │  │              │
│ - Auth JWT      │  │ - Auth JWT      │  │ - Users      │
│ - Upload CSV    │  │ - LDAP Auth     │  │ - Sessions   │
│ - API REST      │  │ - Tickets       │  │ - Configs    │
│ - Anomalies     │  │ - Workflows     │  │              │
│ - FATCA         │  │ - RPA Jobs      │  │              │
│ - Stats/KPIs    │  │ - KPIs          │  │              │
│ - Agences       │  │ - Reconciliation│  │              │
│                 │  │ - JDBC Conn.    │  │              │
└────────┬────────┘  └────────┬────────┘  └──────────────┘
         │                    │
         ▼                    ▼
   ┌──────────┐        ┌──────────────┐
   │  MySQL   │        │   Informix   │
   │  (Local) │        │  CoreBanking │
   └──────────┘        └──────────────┘
```

### Problèmes de l'architecture actuelle

1. **Double maintenance** : 2 backends à maintenir
2. **Duplication de code** : Auth JWT dans les 2 backends
3. **Complexité** : Frontend doit gérer 2 APIs différentes
4. **Ressources** : 2 serveurs qui tournent en permanence
5. **Déploiement** : 2 processus de déploiement distincts
6. **Confusion** : Difficile de savoir quelle fonctionnalité est où

## 🎯 Architecture Cible : Backend Java Unique

```
┌─────────────────────────────────────┐
│   FRONTEND REACT                    │
│   Port: 5174                        │
│   - Interface utilisateur           │
│   - Tableaux de bord                │
│   - Graphiques & KPIs               │
└─────────┬───────────────────────────┘
          │
          │  API REST unique
          │
          ▼
┌──────────────────────────────────────┐
│   BACKEND JAVA SPRING BOOT          │
│   Port: 8080                        │
│                                     │
│  ✅ Auth JWT & LDAP                 │
│  ✅ Upload CSV/Excel                │
│  ✅ API REST Complète               │
│  ✅ CRUD Anomalies                  │
│  ✅ FATCA & Conformité              │
│  ✅ Stats & KPIs                    │
│  ✅ Gestion Tickets                 │
│  ✅ Workflows Camunda               │
│  ✅ RPA Jobs                        │
│  ✅ Réconciliation                  │
│  ✅ Connexions JDBC                 │
│  ✅ Gestion Utilisateurs            │
│  ✅ Configuration CoreBanking       │
└───────┬──────────────────┬──────────┘
        │                  │
        ▼                  ▼
  ┌──────────┐      ┌──────────────┐
  │ Supabase │      │   Informix   │
  │ Cloud DB │      │ CoreBanking  │
  │          │      │              │
  │ - Users  │      │ - Clients    │
  │ - Config │      │ - Comptes    │
  │ - Tickets│      │ - Transactions│
  │ - KPIs   │      │              │
  └──────────┘      └──────────────┘
```

## ✅ Avantages de la Migration

### 1. **Architecture simplifiée**
- Un seul backend à maintenir
- Une seule API REST
- Un seul point d'entrée

### 2. **Performance**
- Java Spring Boot est plus performant pour le traitement de gros volumes
- Meilleure gestion de la mémoire
- Pool de connexions JDBC natif et optimisé

### 3. **Robustesse**
- Typage fort (Java vs JavaScript)
- Moins d'erreurs à l'exécution
- Meilleure gestion des exceptions

### 4. **Scalabilité**
- Plus facile à scaler horizontalement
- Meilleur support multi-threading
- Gestion mémoire optimisée

### 5. **Maintenance**
- Code plus structuré (architecture en couches)
- Moins de duplication
- Tests unitaires plus robustes

### 6. **Sécurité**
- Framework de sécurité Spring Security
- LDAP intégré
- JWT natif
- Protection CSRF, XSS, etc.

### 7. **Intégration**
- Camunda pour les workflows
- Support natif des transactions
- Meilleure intégration avec bases de données d'entreprise

## 📦 Fonctionnalités à Migrer

### ✅ Déjà implémenté en Java

| Fonctionnalité | Node.js | Java | Status |
|----------------|---------|------|--------|
| Auth JWT | ✅ | ✅ | **Doublon** |
| Login/Logout | ✅ | ✅ | **Doublon** |
| Gestion Users | ✅ | ✅ | **Doublon** |
| Tickets | ❌ | ✅ | **OK Java** |
| Workflows | ❌ | ✅ | **OK Java** |
| RPA Jobs | ❌ | ✅ | **OK Java** |
| KPIs | ✅ | ✅ | **Doublon** |
| Réconciliation | ✅ | ✅ | **Doublon** |
| JDBC CoreBanking | ✅ | ✅ | **Doublon** |

### 🔄 À migrer vers Java

| Fonctionnalité | Fichier Node.js | Contrôleur Java à créer | Complexité |
|----------------|----------------|------------------------|------------|
| **Upload CSV/Excel** | `server/index.js` | `FileUploadController` | 🟡 Moyenne |
| **Anomalies Individual** | `GET /api/anomalies/individual` | `AnomalyController` | 🟢 Facile |
| **Anomalies Corporate** | `GET /api/anomalies/corporate` | `AnomalyController` | 🟢 Facile |
| **Anomalies Institutional** | `GET /api/anomalies/institutional` | `AnomalyController` | 🟢 Facile |
| **Anomalies by Branch** | `GET /api/anomalies/by-branch` | `AnomalyController` | 🟢 Facile |
| **FATCA Stats** | `GET /api/fatca/stats` | `FatcaController` | 🟢 Facile |
| **FATCA Clients** | `GET /api/fatca/clients` | `FatcaController` | 🟢 Facile |
| **FATCA Corporate** | `GET /api/fatca/corporate` | `FatcaController` | 🟢 Facile |
| **FATCA Indicators** | `GET /api/fatca/indicators` | `FatcaController` | 🟢 Facile |
| **Stats Clients** | `GET /api/stats/clients` | `StatisticsController` | 🟢 Facile |
| **Validation Metrics** | `GET /api/validation-metrics` | `ValidationController` | 🟢 Facile |
| **Agencies** | `GET /api/agencies` | `AgencyController` | 🟢 Facile |
| **Correction Stats** | `GET /api/agency-correction-stats` | `StatisticsController` | 🟢 Facile |
| **Weekly Correction** | `GET /api/correction-stats/weekly` | `StatisticsController` | 🟢 Facile |
| **Data Load History** | `GET /api/data-load-history` | `DataLoadController` | 🟢 Facile |
| **Global Tracking** | `GET /api/tracking/global` | `TrackingController` | 🟢 Facile |
| **Cache Management** | `POST /api/cache/clear` | `CacheController` | 🟢 Facile |

## 🚀 Plan de Migration

### Phase 1 : Préparation (1 jour)
1. ✅ Créer les modèles JPA pour toutes les entités
2. ✅ Créer les repositories Spring Data
3. ✅ Mettre en place les DTOs

### Phase 2 : Migration des Contrôleurs (2-3 jours)
1. ✅ `AnomalyController` - CRUD Anomalies
2. ✅ `FatcaController` - Toutes les API FATCA
3. ✅ `StatisticsController` - KPIs et stats
4. ✅ `FileUploadController` - Upload CSV/Excel
5. ✅ `AgencyController` - Gestion agences
6. ✅ `ValidationController` - Règles de validation
7. ✅ `TrackingController` - Suivi global

### Phase 3 : Services (2 jours)
1. ✅ `AnomalyService` - Logique métier anomalies
2. ✅ `FatcaService` - Logique FATCA
3. ✅ `FileProcessingService` - Traitement fichiers
4. ✅ `StatisticsService` - Calculs statistiques
5. ✅ `CacheService` - Gestion cache (Redis)

### Phase 4 : Tests (1-2 jours)
1. ✅ Tests unitaires des services
2. ✅ Tests d'intégration des contrôleurs
3. ✅ Tests de performance
4. ✅ Tests de charge

### Phase 5 : Déploiement (1 jour)
1. ✅ Configuration production
2. ✅ Migration des données si nécessaire
3. ✅ Mise en production progressive
4. ✅ Monitoring

## 📝 Exemple de Migration

### Avant (Node.js Express)

```javascript
// server/index.js
app.get('/api/anomalies/individual', async (req, res) => {
  try {
    const connection = await getMySQLConnection();
    const [rows] = await connection.query(`
      SELECT * FROM anomalies
      WHERE client_type = 'individual'
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});
```

### Après (Java Spring Boot)

```java
// AnomalyController.java
@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyService anomalyService;

    @GetMapping("/individual")
    public ResponseEntity<ApiResponse<List<AnomalyDto>>> getIndividualAnomalies(
            @RequestParam(defaultValue = "100") int limit) {

        List<AnomalyDto> anomalies = anomalyService
            .getAnomaliesByType(ClientType.INDIVIDUAL, limit);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }
}

// AnomalyService.java
@Service
@RequiredArgsConstructor
public class AnomalyService {

    private final AnomalyRepository anomalyRepository;

    public List<AnomalyDto> getAnomaliesByType(ClientType type, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit,
            Sort.by("createdAt").descending());

        return anomalyRepository
            .findByClientType(type, pageRequest)
            .stream()
            .map(this::mapToDto)
            .toList();
    }
}
```

## 🔧 Technologies Utilisées

### Backend Java Spring Boot

| Technologie | Usage |
|-------------|-------|
| **Spring Boot 3.x** | Framework principal |
| **Spring Security** | Authentification & Autorisation |
| **Spring Data JPA** | Accès base de données |
| **JWT** | Tokens d'authentification |
| **LDAP** | Intégration Active Directory |
| **Camunda** | Workflows & BPM |
| **Lombok** | Réduction boilerplate |
| **MapStruct** | Mapping entités/DTOs |
| **Hibernate** | ORM |
| **HikariCP** | Pool de connexions |
| **Flyway** | Migration base de données |
| **Apache POI** | Lecture Excel/CSV |
| **Redis** | Cache distribué |
| **Micrometer** | Métriques & Monitoring |

## 💾 Gestion des Bases de Données

### Connexions

```java
// application.yml
spring:
  datasource:
    # Base principale (Supabase PostgreSQL)
    primary:
      url: ${SUPABASE_DB_URL}
      username: ${SUPABASE_DB_USER}
      password: ${SUPABASE_DB_PASSWORD}
      driver-class-name: org.postgresql.Driver
      hikari:
        maximum-pool-size: 20

    # Base CoreBanking (Informix)
    corebanking:
      url: jdbc:informix-sqli://localhost:9088/lcb:INFORMIXSERVER=ol_informix1210
      username: bank
      password: ${INFORMIX_PASSWORD}
      driver-class-name: com.informix.jdbc.IfxDriver
      hikari:
        maximum-pool-size: 10
```

## 📊 Upload CSV/Excel en Java

```java
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileProcessingService fileProcessingService;

    @PostMapping("/csv")
    public ResponseEntity<ApiResponse<UploadResult>> uploadCsv(
            @RequestParam("file") MultipartFile file) {

        validateFile(file, "csv");

        UploadResult result = fileProcessingService.processCsvFile(file);

        return ResponseEntity.ok(ApiResponse.success(
            "Fichier traité avec succès", result));
    }

    @PostMapping("/excel")
    public ResponseEntity<ApiResponse<UploadResult>> uploadExcel(
            @RequestParam("file") MultipartFile file) {

        validateFile(file, "xlsx", "xls");

        UploadResult result = fileProcessingService.processExcelFile(file);

        return ResponseEntity.ok(ApiResponse.success(
            "Fichier traité avec succès", result));
    }

    private void validateFile(MultipartFile file, String... extensions) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }

        String filename = file.getOriginalFilename();
        boolean validExtension = Arrays.stream(extensions)
            .anyMatch(ext -> filename.endsWith("." + ext));

        if (!validExtension) {
            throw new BadRequestException(
                "Extension invalide. Extensions acceptées: " +
                String.join(", ", extensions));
        }
    }
}
```

## 🎯 Recommandation

**OUI, migrez vers Java !**

### Pourquoi ?

1. **Vous avez déjà 60% du code en Java** (Auth, Tickets, Workflows, RPA)
2. **Le backend Node.js ne fait que du CRUD simple** (facile à migrer)
3. **Java est meilleur pour les applications d'entreprise**
4. **Votre base CoreBanking est en Informix** (mieux supporté en Java)
5. **Maintenance simplifiée** (1 backend au lieu de 2)
6. **Performance améliorée** pour les gros volumes

### Timeline estimée : **1 semaine**

- Jour 1-2 : Modèles et repositories
- Jour 3-4 : Contrôleurs et services
- Jour 5 : Upload fichiers
- Jour 6 : Tests
- Jour 7 : Déploiement

## 📋 Checklist de Migration

- [ ] Créer les modèles JPA (Anomaly, FatcaClient, etc.)
- [ ] Créer les repositories Spring Data
- [ ] Créer les DTOs
- [ ] Migrer AnomalyController
- [ ] Migrer FatcaController
- [ ] Migrer StatisticsController
- [ ] Migrer FileUploadController
- [ ] Implémenter traitement CSV/Excel
- [ ] Migrer AgencyController
- [ ] Migrer ValidationController
- [ ] Migrer TrackingController
- [ ] Configurer Redis cache
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation API (Swagger)
- [ ] Déploiement
- [ ] Désactiver backend Node.js
- [ ] Supprimer code Node.js obsolète

## 🚦 Vous voulez que je commence la migration ?

Je peux créer tous les contrôleurs, services et modèles Java pour remplacer complètement le backend Node.js.

Voulez-vous que je procède ?
