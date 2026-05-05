# AI Detection Module - Architecture

## System Overview

The AI Detection module follows a modular, loosely-coupled architecture that allows it to be enabled or disabled without affecting the core validation functionality.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE MODULE (Always Active)                  │
├─────────────────────────────────────────────────────────────────┤
│  ValidationRule ──▶ NaturalLanguageRuleParser ──▶ Anomaly      │
│  (SQL/JSON)         (20 rule types)              (detection)   │
│                                                                 │
│  CbsValidationService.validateRecords()                        │
│  AnomalyService.create/update/search()                         │
│  AnomalyRepository (all queries)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ extends (optional)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI MODULE (Optional)                         │
├─────────────────────────────────────────────────────────────────┤
│  @ConditionalOnProperty("app.features.ai-detection.enabled")   │
│                                                                 │
│  AiDetectionService (Main Orchestrator)                         │
│  ├── scoreRecords(records) → RiskScores                        │
│  ├── getSuggestion(anomalyId) → Suggestion                     │
│  ├── explainAnomaly(anomalyId) → Explanation                   │
│  └── enrichAnomalies(anomalies, records) → Enriched data       │
│                                                                 │
│  AiDetectionClient (calls Python ML service)                   │
│  OllamaService (LLM fallback for explanations & suggestions)   │
│  AiDetectionController (/api/ai-detection/*)                   │
│  AiFallbackHandler (graceful degradation)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Package Structure

```
backend/src/main/java/com/adakalgroup/bdqm/
├── service/
│   ├── CbsValidationService.java          # Core (unchanged logic)
│   └── AnomalyService.java                # Core (unchanged)
│
├── ai/                                     # AI Module
│   ├── config/
│   │   ├── AiDetectionConfig.java         # Feature flags, beans
│   │   ├── AiDetectionProperties.java     # Configuration properties
│   │   └── AiServiceProperties.java       # ML service settings
│   ├── client/
│   │   └── AiDetectionClient.java         # HTTP client to ML service
│   ├── service/
│   │   ├── AiDetectionService.java        # Main AI orchestrator
│   │   ├── OllamaService.java             # Ollama LLM fallback
│   │   ├── RiskScoringService.java        # Risk scoring logic
│   │   └── CorrectionSuggestionService.java
│   ├── model/
│   │   ├── RiskScore.java
│   │   ├── RiskFactor.java
│   │   ├── CorrectionSuggestion.java
│   │   ├── SuggestionAlternative.java
│   │   └── AnomalyCluster.java
│   ├── dto/
│   │   ├── RiskScoreRequest.java
│   │   ├── RiskScoreResponse.java
│   │   ├── SuggestionRequest.java
│   │   ├── SuggestionResponse.java
│   │   └── AiDetectionStatusResponse.java
│   ├── controller/
│   │   └── AiDetectionController.java     # /api/ai-detection/*
│   └── fallback/
│       └── AiFallbackHandler.java         # Graceful degradation
```

## ML Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python ML Service                            │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Application (Port 8000)                                │
│                                                                 │
│  Endpoints:                                                     │
│  ├── POST /score          → Risk scoring                        │
│  ├── POST /suggest        → Correction suggestion               │
│  ├── POST /cluster        → Anomaly clustering                  │
│  ├── GET  /health         → Health check                        │
│  └── GET  /models         → Model registry                      │
│                                                                 │
│  Models:                                                        │
│  ├── risk_scorer.pkl      → XGBoost classifier                  │
│  ├── suggester_*.pkl      → Per-field correction models         │
│  └── embeddings.pkl       → Feature embeddings                  │
└─────────────────────────────────────────────────────────────────┘
```

## Ollama LLM Service (Fallback)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ollama LLM Service                           │
├─────────────────────────────────────────────────────────────────┤
│  Local Ollama Server (Port 11434)                               │
│                                                                 │
│  Features:                                                      │
│  ├── Anomaly explanations (natural language)                    │
│  ├── Correction suggestions (when ML has no training data)      │
│  └── Rate-limited (max 2 concurrent calls)                      │
│                                                                 │
│  Models:                                                        │
│  └── llama3 or mistral (configurable)                           │
│                                                                 │
│  Used when:                                                     │
│  ├── ML Service unavailable                                     │
│  ├── ML model returns no suggestion (no training data)          │
│  └── User requests anomaly explanation                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Risk Scoring Flow

```
1. CbsValidationService receives records for validation
2. If AI enabled: Call AiDetectionService.scoreRecords(records)
3. AiDetectionClient sends HTTP POST to ML Service /score
4. ML Service extracts features and runs XGBoost model
5. Returns risk scores with top risk factors
6. Scores are attached to anomalies (optional field)
7. Dashboard displays risk indicators
```

### Correction Suggestion Flow

```
1. Anomaly is created/displayed in UI
2. If AI enabled: Call AiDetectionService.getSuggestion(anomalyId)
3. Check cache for recent suggestion
4. If not cached:
   a. AiDetectionClient sends HTTP POST to ML Service /suggest
   b. If ML returns suggestion: Use it (source: ML_MODEL)
   c. If ML returns no suggestion: Call OllamaService.suggestCorrection()
      - Ollama generates suggestion (source: LLM_FALLBACK)
5. Save suggestion to database with source and confidence
6. Returns suggestion with confidence score
7. UI displays suggestion with one-click apply
8. User feedback (accept/reject) is logged for retraining
```

### Anomaly Explanation Flow (via Ollama)

```
1. User requests explanation for an anomaly
2. AiDetectionService.explainAnomaly(anomalyId)
3. OllamaService.explainAnomaly(anomaly)
4. Ollama generates natural language explanation in French
5. Returns explanation to frontend
```

## Integration Pattern

### Optional Dependency Injection

```java
@Service
public class CbsValidationService {

    private final AnomalyRepository anomalyRepository;
    private final ValidationRuleRepository ruleRepository;

    // Optional AI module - injected only if enabled
    private final Optional<AiDetectionService> aiDetectionService;

    public CbsValidationService(
            AnomalyRepository anomalyRepository,
            ValidationRuleRepository ruleRepository,
            @Autowired(required = false) AiDetectionService aiDetectionService) {
        this.anomalyRepository = anomalyRepository;
        this.ruleRepository = ruleRepository;
        this.aiDetectionService = Optional.ofNullable(aiDetectionService);
    }

    public ValidationResult validateRecords(String tableName,
                                            List<Map<String, Object>> records) {
        // 1. CORE: SQL-based validation (always runs)
        List<Anomaly> anomalies = validateWithRules(tableName, records);

        // 2. AI ENHANCEMENT: Risk scoring (optional)
        if (aiDetectionService.isPresent() && isRiskScoringEnabled()) {
            enrichWithRiskScores(anomalies);
        }

        // 3. AI ENHANCEMENT: Correction suggestions (optional)
        if (aiDetectionService.isPresent() && isSuggestionsEnabled()) {
            addCorrectionSuggestions(anomalies);
        }

        // 4. Save anomalies
        anomalyRepository.saveAll(anomalies);

        return new ValidationResult(/* metrics */);
    }
}
```

## Graceful Degradation

The AI module uses a multi-tier fallback strategy:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FALLBACK HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ML Service (Primary)                                        │
│     ├── Fast, trained models                                    │
│     └── High confidence scores                                  │
│              │                                                  │
│              ▼ (if unavailable or no result)                    │
│  2. Ollama LLM (Secondary)                                      │
│     ├── Natural language understanding                          │
│     └── Works without training data                             │
│              │                                                  │
│              ▼ (if unavailable)                                 │
│  3. No AI (Graceful Skip)                                       │
│     ├── Core SQL validation continues                           │
│     └── Anomalies created without AI enrichment                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Scenario | Behavior |
|----------|----------|
| ML Service unavailable | Try Ollama LLM fallback |
| ML Service timeout | Return empty scores, continue |
| ML returns no suggestion | Fall back to Ollama LLM |
| Ollama unavailable | Skip AI enrichment, log warning |
| Both unavailable | Continue with core validation only |

```java
@Component
public class AiFallbackHandler {

    public <T> T executeWithFallback(Supplier<T> aiCall,
                                     Supplier<T> fallback,
                                     String operationName) {
        try {
            return aiCall.get();
        } catch (AiServiceException e) {
            log.warn("AI {} failed, using fallback: {}",
                     operationName, e.getMessage());
            return fallback.get();
        }
    }
}
```

## Security Considerations

1. **Network Isolation**: ML Service should run in same network as backend
2. **No Sensitive Data**: ML Service only receives field values, not PII
3. **Rate Limiting**: Semaphore limits concurrent AI calls
4. **Timeout Protection**: All AI calls have configurable timeouts
5. **Audit Logging**: All AI decisions are logged for compliance
