# Tenancy Specification — Multi-Agency User Access

## Context

Agency users must only see data from agencies they are assigned to. Currently, `User.agencyCode` holds a single agency and there is no centralized enforcement. We need:
- Users assigned to **multiple agencies** simultaneously
- **Time-bound** assignments (dateFrom/dateTo)
- **Activatable/deactivatable** assignments (status)
- **Group-based** permissions per assignment (AppProfile)
- ADMIN/AUDITOR keep global access across all agencies

## Data Model

### New Entities

#### `Structure`
Wraps an Agency as a tenant unit. Each Agency is a Structure.

```
Table: structure
├── id (BIGINT, PK, sequence)
├── code (VARCHAR 10, unique, not null) — maps to agency code
├── name (VARCHAR 100, not null)
├── type (VARCHAR 50) — e.g. "AGENCY", extensible for future
├── parent_id (BIGINT, FK → structure.id, nullable) — for hierarchy if needed
├── status (VARCHAR 20) — ACTIVE / INACTIVE
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
```

- One-to-one relationship with `bkage` (Agency) via `code = bkage.age`
- Extensible: could later support regions, departments, etc.

#### `AppProfile`
A group (not a role). Defines a set of permissions or a functional group.

```
Table: app_profile
├── id (BIGINT, PK, sequence)
├── code (VARCHAR 50, unique, not null) — e.g. "DATA_ENTRY", "VALIDATOR", "VIEWER"
├── name (VARCHAR 100, not null)
├── description (VARCHAR 255)
├── status (VARCHAR 20) — ACTIVE / INACTIVE
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
```

#### `UserProfile`
Links a User to a Structure (tenant) with a time range, status, and group.

```
Table: user_profile
├── id (BIGINT, PK, sequence)
├── date_from (DATE, not null)
├── date_to (DATE, nullable) — null = no end date (permanent)
├── status (VARCHAR 20, not null) — ACTIVE / INACTIVE
├── user_id (BIGINT, FK → users.id, not null)
├── profile_id (BIGINT, FK → app_profile.id, nullable)
├── structure_id (BIGINT, FK → structure.id, not null)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)

Unique constraint: (user_id, structure_id, profile_id, date_from)
Index: idx_user_profile_user_status (user_id, status)
Index: idx_user_profile_structure (structure_id)
```

### Modified Entities

#### `User`
- **Drop** `agency_code` column
- Agencies are now resolved via active `UserProfile` entries

### Enum

#### `UserProfileStatus`
```
ACTIVE, INACTIVE
```

## Relationships

```
User ──1:N──→ UserProfile ──N:1──→ Structure (tenant/agency)
                    │
                    └──N:1──→ AppProfile (group)

Structure ──1:1──→ Agency (bkage)
```

A user can have multiple active UserProfiles → multiple agencies.

---

## AgencySecurityService

**File:** `security/AgencySecurityService.java`

Core tenancy enforcement component. Resolves the current user's accessible agencies from active UserProfiles.

```java
@Component
@RequiredArgsConstructor
public class AgencySecurityService {
    private final KeycloakUserDetails keycloakUserDetails;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    /**
     * Returns list of agency codes the current user can access.
     * Empty list = global access (ADMIN/AUDITOR/system).
     */
    public List<String> getAgencyFilter() {
        if (!keycloakUserDetails.isAuthenticated()) return List.of(); // system context
        if (keycloakUserDetails.hasAnyRole("ADMIN", "AUDITOR")) return List.of();

        String username = keycloakUserDetails.getCurrentUsername()
            .orElseThrow(() -> new AccessDeniedException("No username in token"));

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new AccessDeniedException("User not found"));

        return userProfileRepository
            .findActiveByUserId(user.getId(), LocalDate.now())
            .stream()
            .map(up -> up.getStructure().getCode())
            .collect(Collectors.toList());
    }

    /** Throws 403 if current user cannot access the given agency. */
    public void requireAgencyAccess(String agencyCode) {
        List<String> allowed = getAgencyFilter();
        if (!allowed.isEmpty() && !allowed.contains(agencyCode)) {
            throw new AccessDeniedException("Access denied to agency: " + agencyCode);
        }
    }

    /** Returns true if user has global access (no filtering needed). */
    public boolean isGlobalAccess() {
        return getAgencyFilter().isEmpty();
    }
}
```

**Key query — `UserProfileRepository.findActiveByUserId`:**
```sql
SELECT up FROM UserProfile up
JOIN FETCH up.structure s
WHERE up.user.id = :userId
  AND up.status = 'ACTIVE'
  AND up.dateFrom <= :today
  AND (up.dateTo IS NULL OR up.dateTo >= :today)
```

---

## Service-Layer Filtering Pattern

Every service method that returns data uses this pattern:

```java
List<String> agencies = agencySecurityService.getAgencyFilter();

if (agencies.isEmpty()) {
    // Global access → no filter
    return repo.findAll(pageable).map(this::mapToDto);
} else if (agencies.size() == 1) {
    // Single agency → simple equals
    return repo.findByAgencyCode(agencies.get(0), pageable).map(this::mapToDto);
} else {
    // Multiple agencies → IN clause
    return repo.findByAgencyCodeIn(agencies, pageable).map(this::mapToDto);
}
```

### Services to modify

| Service | Methods to filter |
|---------|------------------|
| `AnomalyService` | getAnomaliesByClientType, getAnomaliesByStatus, getRecentAnomalies, getAnomalyCountsByClientType, getAnomalyCountsByStatus, getAnomaliesByBranch, getTopAnomalyFields, getAnomalyTrends, getAnomalyById (verify), updateAnomaly (verify) |
| `TicketService` | getAllTickets, getTicketById (verify), getTicketsByAgency (verify access) |
| `StatsService` | All stats queries |
| `CorrectionService` | Correction data queries |
| `KpiService` | KPI queries |

### New repository methods needed

**`AnomalyRepository`** — add `In` variants:
- `Page<Anomaly> findByAgencyCodeIn(List<String>, Pageable)`
- `Page<Anomaly> findByClientTypeAndAgencyCodeIn(ClientType, List<String>, Pageable)`
- `Page<Anomaly> findByStatusAndAgencyCodeIn(AnomalyStatus, List<String>, Pageable)`
- `long countByClientTypeAndAgencyCodeIn(ClientType, List<String>)`
- `long countByStatusAndAgencyCodeIn(AnomalyStatus, List<String>)`

**`TicketRepository`** — add:
- `Page<Ticket> findByAgencyCodeIn(List<String>, Pageable)`

---

## SecurityConfig Fix

Remove data endpoints from `permitAll()` (lines 105-112 in SecurityConfig.java):

**Remove from permitAll:**
- `/api/stats/**`, `/api/anomalies/**`, `/api/agencies/**`
- `/api/validation/**`, `/api/fatca/**`, `/api/tracking/**`

These fall through to `anyRequest().authenticated()`.

**Keep as permitAll:**
- `/`, `/index.html`, `/assets/**`, `/favicon.ico`, `/logo-*.png`
- `/actuator/health/**`, `/swagger-ui/**`, `/v3/api-docs/**`
- `/login`, `/login/oauth2/code/**`, `/oauth2/authorization/**`
- `/api/public/**`, `/api/auth-info`, `/api/me`
- `/api/monitoring/**` (frontend error logging)

---

## Controller Access Checks

For endpoints with `{agencyCode}` path parameter, add `requireAgencyAccess()`:

- `AnomalyController.getAnomaliesByAgency()` — verify access
- `TicketController.getTicketsByAgency()` — verify access
- `KpiController` agency endpoints — verify access
- `CorrectionController` agency endpoints — verify access

Remove `@CrossOrigin(origins = "*")` from `AnomalyController` (redundant with CorsConfig).

---

## Migration from User.agencyCode

### Liquibase migration: `012-tenancy-tables.xml`

1. Create tables: `structure`, `app_profile`, `user_profile`
2. Seed `structure` from existing `bkage`: `INSERT INTO structure (code, name, type, status) SELECT age, lib, 'AGENCY', 'ACTIVE' FROM bkage`
3. Seed default `app_profile`: insert a "DEFAULT" profile
4. Migrate existing user-agency assignments: `INSERT INTO user_profile (date_from, status, user_id, structure_id, profile_id) SELECT CURRENT_DATE, 'ACTIVE', u.id, s.id, (default profile id) FROM users u JOIN structure s ON s.code = u.agency_code WHERE u.agency_code IS NOT NULL`
5. Drop `users.agency_code` column

### Keycloak token

- `agency_code` claim is no longer the source of truth for multi-agency
- **Recommended:** Remove it from token. Tenancy is DB-driven, not token-driven. Simpler.

### Frontend impact

- `SessionAuthProvider` currently reads `agencyCode` from user info → change to `agencyCodes: string[]`
- `AnomaliesFilters` already supports agency selection → update to use user's allowed agencies list
- `AgencyUserRoute` → update to check user has at least one active agency assignment
- `/api/me` endpoint → return list of user's active agency codes

---

## Implementation Order

1. **Create `docs/tenacy_spec.md`** — this spec
2. **Liquibase migration `012-tenancy-tables.xml`** — create Structure, AppProfile, UserProfile tables + seed data + drop User.agencyCode
3. **New entities** — Structure.java, AppProfile.java, UserProfile.java, UserProfileStatus.java
4. **New repositories** — StructureRepository, AppProfileRepository, UserProfileRepository
5. **AgencySecurityService** — core tenancy enforcement
6. **Fix SecurityConfig** — remove permitAll from data endpoints
7. **Update services** — inject AgencySecurityService, add filtering
8. **Add repository query methods** — `findByAgencyCodeIn` variants
9. **Update controllers** — add requireAgencyAccess on path params
10. **Update UserService** — remove agencyCode references, add UserProfile management
11. **Update /api/me endpoint** — return user's active agencies
12. **Update frontend** — adapt to multi-agency model

## Verification

1. **Build:** `./mvnw compile`
2. **Migration:** Liquibase runs successfully, existing data migrated
3. **Test as ADMIN:** sees all data across agencies
4. **Test as AGENCY_USER with 1 agency:** sees only that agency's data
5. **Test as AGENCY_USER with 2 agencies:** sees both agencies' data
6. **Test cross-agency access:** `GET /api/anomalies/by-agency/{otherAgency}` → 403
7. **Test unauthenticated:** `GET /api/anomalies` → 401
8. **Test expired assignment:** UserProfile with past dateTo → no access to that agency
