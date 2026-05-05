# AI Detection Module - Configuration

## Environment Variables

### Master Switch

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_AI_DETECTION` | `false` | Enable/disable entire AI module |

### Feature Toggles

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_RISK_SCORING` | `true` | Enable risk scoring (requires master switch) |
| `AI_SUGGESTIONS` | `true` | Enable correction suggestions |
| `AI_CLUSTERING` | `false` | Enable anomaly clustering |
| `AI_AUTO_APPLY_THRESHOLD` | `0.95` | Auto-apply suggestions above this confidence |

### ML Service Connection

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_URL` | `http://localhost:8000` | Python ML service URL |
| `AI_SERVICE_TIMEOUT_MS` | `5000` | Request timeout in milliseconds |
| `AI_SERVICE_MAX_RETRIES` | `2` | Maximum retry attempts |
| `AI_FALLBACK_ON_ERROR` | `true` | Continue without AI on errors |

### Concurrency Control

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MAX_CONCURRENT_CALLS` | `4` | Max parallel AI requests |
| `AI_BATCH_SIZE` | `100` | Records per batch for scoring |

### Ollama LLM (Fallback)

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_AI_OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |

> **Note:** Ollama is used as a fallback when ML models are unavailable or lack training data. It provides natural language explanations and correction suggestions.

## Application Configuration

### application.yml

```yaml
app:
  features:
    ai-detection:
      enabled: ${FEATURE_AI_DETECTION:false}
      risk-scoring: ${AI_RISK_SCORING:true}
      correction-suggestions: ${AI_SUGGESTIONS:true}
      clustering: ${AI_CLUSTERING:false}
      auto-apply-threshold: ${AI_AUTO_APPLY_THRESHOLD:0.95}

  ai:
    service:
      url: ${AI_SERVICE_URL:http://localhost:8000}
      timeout-ms: ${AI_SERVICE_TIMEOUT_MS:5000}
      max-retries: ${AI_SERVICE_MAX_RETRIES:2}
      fallback-on-error: ${AI_FALLBACK_ON_ERROR:true}

    concurrency:
      max-concurrent-calls: ${AI_MAX_CONCURRENT_CALLS:4}
      batch-size: ${AI_BATCH_SIZE:100}

# Ollama LLM configuration (for fallback and explanations)
spring:
  ai:
    ollama:
      base-url: ${SPRING_AI_OLLAMA_BASE_URL:http://localhost:11434}
      chat:
        model: ${OLLAMA_MODEL:llama3}
```

### application-docker.yml (Docker overrides)

```yaml
app:
  ai:
    service:
      url: ${AI_SERVICE_URL:http://ai-detection:8000}
```

### application-dev.yml (Development overrides)

```yaml
app:
  features:
    ai-detection:
      enabled: true  # Enable in dev for testing

  ai:
    service:
      url: http://localhost:8000
      timeout-ms: 10000  # Longer timeout for debugging
```

## Spring Configuration Class

```java
@Configuration
@ConfigurationProperties(prefix = "app.features.ai-detection")
@Data
public class AiDetectionProperties {

    private boolean enabled = false;
    private boolean riskScoring = true;
    private boolean correctionSuggestions = true;
    private boolean clustering = false;
    private double autoApplyThreshold = 0.95;
}

@Configuration
@ConfigurationProperties(prefix = "app.ai.service")
@Data
public class AiServiceProperties {

    private String url = "http://localhost:8000";
    private int timeoutMs = 5000;
    private int maxRetries = 2;
    private boolean fallbackOnError = true;
}

@Configuration
@ConfigurationProperties(prefix = "app.ai.concurrency")
@Data
public class AiConcurrencyProperties {

    private int maxConcurrentCalls = 4;
    private int batchSize = 100;
}
```

## Conditional Bean Registration

```java
@Configuration
@ConditionalOnProperty(
    name = "app.features.ai-detection.enabled",
    havingValue = "true"
)
public class AiDetectionConfig {

    @Bean
    public AiDetectionClient aiDetectionClient(AiServiceProperties props) {
        return new AiDetectionClient(
            props.getUrl(),
            props.getTimeoutMs(),
            props.getMaxRetries()
        );
    }

    @Bean
    public AiDetectionService aiDetectionService(
            AiDetectionClient client,
            AnomalyRepository anomalyRepository,
            AiDetectionProperties props) {
        return new AiDetectionService(client, anomalyRepository, props);
    }

    @Bean
    @ConditionalOnProperty(
        name = "app.features.ai-detection.risk-scoring",
        havingValue = "true"
    )
    public RiskScoringService riskScoringService(AiDetectionClient client) {
        return new RiskScoringService(client);
    }

    @Bean
    @ConditionalOnProperty(
        name = "app.features.ai-detection.correction-suggestions",
        havingValue = "true"
    )
    public CorrectionSuggestionService correctionSuggestionService(
            AiDetectionClient client,
            AiSuggestionRepository suggestionRepository) {
        return new CorrectionSuggestionService(client, suggestionRepository);
    }
}
```

## Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - FEATURE_AI_DETECTION=true
      - AI_SERVICE_URL=http://ai-detection:8000
      - SPRING_AI_OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      ai-detection:
        condition: service_healthy
      ollama:
        condition: service_started

  ai-detection:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/models
      - LOG_LEVEL=INFO
    volumes:
      - ./ai-service/models:/app/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    # Pull model on startup (optional)
    # entrypoint: /bin/sh -c "ollama pull llama3 && ollama serve"

volumes:
  ollama-data:
```

## Enabling AI Detection

### Step 1: Deploy ML Service

```bash
cd ai-service
docker build -t bdqm-ai-detection:latest .
docker run -d -p 8000:8000 bdqm-ai-detection:latest
```

### Step 2: Verify ML Service Health

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "models_loaded": true}
```

### Step 3: Enable Feature Flag

```bash
# Set environment variable
export FEATURE_AI_DETECTION=true
export AI_SERVICE_URL=http://localhost:8000

# Or in .env file
echo "FEATURE_AI_DETECTION=true" >> .env
echo "AI_SERVICE_URL=http://localhost:8000" >> .env
```

### Step 4: Restart Backend

```bash
docker-compose restart backend
# Or
./mvnw spring-boot:run
```

### Step 5: Verify AI Module Active

```bash
curl http://localhost:8080/api/ai-detection/status
# Expected: {"enabled": true, "features": {...}}
```

## Disabling AI Detection

Simply set:

```bash
FEATURE_AI_DETECTION=false
```

No other changes required. The system will continue operating with SQL-only validation.
