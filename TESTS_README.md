# 🧪 Guide Tests Automatisés

## ✅ Tests implémentés

### 1. Tests Unitaires Java (JUnit 5 + Mockito)

**Fichier** : `backend-java/src/test/java/.../service/AnomalyServiceTest.java`

**Tests :**
- ✅ Création anomalie
- ✅ Récupération par ID
- ✅ Récupération par type client
- ✅ Mise à jour anomalie
- ✅ Suppression anomalie
- ✅ Récupération par agence
- ✅ Récupération par statut
- ✅ Comptage par statut

**Coverage cible** : 80%+

### 2. Tests d'Intégration (Spring Boot Test)

**Fichier** : `backend-java/src/test/java/.../controller/AnomalyControllerIntegrationTest.java`

**Tests :**
- ✅ GET /api/anomalies/individual
- ✅ GET /api/anomalies/corporate
- ✅ GET /api/anomalies/institutional
- ✅ GET /api/anomalies/by-branch
- ✅ GET /api/anomalies/recent
- ✅ POST /api/anomalies (création)
- ✅ PUT /api/anomalies/{id} (mise à jour)
- ✅ DELETE /api/anomalies/{id} (suppression)

### 3. Tests E2E (Playwright)

**Fichier** : `tests/e2e/login.spec.ts`

**Tests :**
- ✅ Login avec credentials valides
- ✅ Login avec credentials invalides
- ✅ Logout

---

## 🚀 Exécution des tests

### Tests Unitaires

```bash
cd backend-java

# Lancer tous les tests
mvn test

# Lancer un test spécifique
mvn test -Dtest=AnomalyServiceTest

# Générer rapport coverage
mvn test jacoco:report
# Rapport dans : target/site/jacoco/index.html
```

### Tests d'Intégration

```bash
cd backend-java

# Lancer tests intégration
mvn integration-test

# Ou avec verify (recommandé)
mvn verify
```

### Tests E2E Playwright

```bash
# Installation (première fois)
npm install -D @playwright/test
npx playwright install

# Lancer tous les tests E2E
npx playwright test

# Mode interactif
npx playwright test --ui

# Mode debug
npx playwright test --debug

# Tests spécifiques
npx playwright test login.spec.ts

# Générer rapport
npx playwright show-report
```

---

## 📊 Vérifier Coverage

### Java (JaCoCo)

```bash
cd backend-java
mvn clean test jacoco:report

# Ouvrir rapport
open target/site/jacoco/index.html
# Ou : firefox target/site/jacoco/index.html
```

**Objectif** : 80% coverage minimum

### Playwright

```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## ✍️ Écrire de nouveaux tests

### Test Unitaire Service

```java
@ExtendWith(MockitoExtension.class)
class MyServiceTest {

    @Mock
    private MyRepository repository;

    @InjectMocks
    private MyService service;

    @Test
    void shouldDoSomething() {
        // Given
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        // When
        MyDto result = service.getById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(repository, times(1)).findById(1L);
    }
}
```

### Test Intégration Controller

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class MyControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldGetData() throws Exception {
        mockMvc.perform(get("/api/myendpoint"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

### Test E2E Playwright

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('http://localhost:5173/mypage');

  await page.click('button#mybutton');

  await expect(page.locator('text=Success')).toBeVisible();
});
```

---

## 🔧 Configuration

### JUnit 5 (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
```

### Playwright (package.json)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

---

## 🎯 Best Practices

### Tests Unitaires

1. **Isoler les dépendances** : Utiliser mocks
2. **Tester un seul comportement** par test
3. **Noms explicites** : `shouldReturnUserWhenIdExists`
4. **AAA Pattern** : Arrange, Act, Assert
5. **Pas de logique** dans les tests
6. **Rapides** : < 100ms par test

### Tests Intégration

1. **Utiliser @Transactional** : Rollback auto
2. **Données de test** isolées
3. **Tester les vrais endpoints** HTTP
4. **Vérifier status codes** et responses
5. **Cleanup** après tests

### Tests E2E

1. **Tests critiques** seulement
2. **Données de test** stables
3. **Sélecteurs robustes** (data-testid)
4. **Attentes explicites** (waitFor)
5. **Cleanup** entre tests
6. **Screenshots** en cas d'échec

---

## 🐛 Troubleshooting

### Tests échouent en local mais pas en CI

```bash
# Nettoyer et recompiler
mvn clean install -DskipTests
mvn test
```

### Tests Playwright timeout

```typescript
// Augmenter timeout
test.setTimeout(60000);

// Ou dans config
timeout: 60000
```

### Base de données test

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    hibernate:
      ddl-auto: create-drop
```

### Mock ne fonctionne pas

```java
// Vérifier annotations
@ExtendWith(MockitoExtension.class) // Classe
@Mock // Dépendance
@InjectMocks // Service à tester
```

---

## 📈 Métriques Tests

### Objectifs

| Métrique | Objectif |
|----------|----------|
| **Coverage** | > 80% |
| **Tests unitaires** | > 100 tests |
| **Tests intégration** | > 30 tests |
| **Tests E2E** | 10-20 critiques |
| **Temps exécution** | < 5 min |

### Vérifier métriques

```bash
# Coverage
mvn jacoco:report
cat target/site/jacoco/index.html

# Nombre tests
mvn test | grep "Tests run"

# Temps
mvn test | grep "Time elapsed"
```

---

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Run tests
        run: mvn test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## ✅ Checklist Tests

### Avant commit
- [ ] Tous les tests passent
- [ ] Coverage > 80%
- [ ] Pas de tests ignorés (@Disabled)
- [ ] Pas de System.out.println()
- [ ] Tests E2E critiques passent

### Avant PR
- [ ] Tests unitaires OK
- [ ] Tests intégration OK
- [ ] Tests E2E OK
- [ ] Pas de régression
- [ ] Nouveaux tests ajoutés

### Avant production
- [ ] Tous tests verts
- [ ] Coverage vérifié
- [ ] Tests de charge OK
- [ ] Tests sécurité OK

---

## 🎓 Ressources

### Documentation
- [JUnit 5](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Test](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [Playwright](https://playwright.dev/docs/intro)

### Tutoriels
- [Testing Spring Boot](https://www.baeldung.com/spring-boot-testing)
- [Mockito Tutorial](https://www.baeldung.com/mockito-series)
- [Playwright Tutorial](https://playwright.dev/docs/intro)

---

**Version** : 2.0.0
**Date** : 2025-01-04
**Status** : ✅ Ready
