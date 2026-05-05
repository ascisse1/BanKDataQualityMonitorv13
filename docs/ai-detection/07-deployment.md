# AI Detection Module - Deployment Guide

## Prerequisites

- BDQM Backend running (Java 17+)
- PostgreSQL database accessible
- Docker (for ML service)
- Sufficient memory for ML models (~2GB)

## Deployment Options

### Option 1: Docker Compose (Recommended)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    image: bdqm-backend:latest
    ports:
      - "8080:8080"
    environment:
      # Database
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=bdqm
      - DB_USER=bdqm
      - DB_PASSWORD=${DB_PASSWORD}

      # AI Detection Module
      - FEATURE_AI_DETECTION=true
      - AI_SERVICE_URL=http://ai-detection:8000
      - AI_SERVICE_TIMEOUT_MS=5000
      - AI_FALLBACK_ON_ERROR=true

      # Feature toggles
      - AI_RISK_SCORING=true
      - AI_SUGGESTIONS=true
      - AI_CLUSTERING=false

      # Liquibase context for AI tables
      - SPRING_LIQUIBASE_CONTEXTS=default,ai-detection
    depends_on:
      postgres:
        condition: service_healthy
      ai-detection:
        condition: service_healthy

  ai-detection:
    image: bdqm-ai-detection:latest
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/models
      - LOG_LEVEL=INFO
      - WORKERS=4
    volumes:
      - ./ai-service/models:/app/models:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=bdqm
      - POSTGRES_USER=bdqm
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bdqm"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### Deployment Commands

```bash
# Build images
docker-compose build

# Start with AI enabled
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs ai-detection

# Verify AI module
curl http://localhost:8080/api/ai-detection/status
```

### Option 2: Kubernetes

#### ai-detection-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-detection
  labels:
    app: ai-detection
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-detection
  template:
    metadata:
      labels:
        app: ai-detection
    spec:
      containers:
        - name: ai-detection
          image: bdqm-ai-detection:latest
          ports:
            - containerPort: 8000
          env:
            - name: MODEL_PATH
              value: /app/models
            - name: LOG_LEVEL
              value: INFO
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
          volumeMounts:
            - name: models
              mountPath: /app/models
              readOnly: true
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: ai-models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ai-detection
spec:
  selector:
    app: ai-detection
  ports:
    - port: 8000
      targetPort: 8000
  type: ClusterIP
```

#### backend-configmap.yaml (AI settings)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bdqm-backend-config
data:
  FEATURE_AI_DETECTION: "true"
  AI_SERVICE_URL: "http://ai-detection:8000"
  AI_SERVICE_TIMEOUT_MS: "5000"
  AI_FALLBACK_ON_ERROR: "true"
  AI_RISK_SCORING: "true"
  AI_SUGGESTIONS: "true"
  AI_CLUSTERING: "false"
  SPRING_LIQUIBASE_CONTEXTS: "default,ai-detection"
```

### Option 3: Standalone (Without AI)

To run BDQM without the AI module:

```bash
# Simply don't set the feature flag (defaults to false)
export FEATURE_AI_DETECTION=false

# Or explicitly disable
docker run -e FEATURE_AI_DETECTION=false bdqm-backend:latest
```

## Database Migrations

### Enabling AI Tables

The AI tables are only created when Liquibase runs with the `ai-detection` context.

```bash
# Run migrations with AI context
java -jar bdqm-backend.jar \
  --spring.liquibase.contexts=default,ai-detection

# Or via environment variable
SPRING_LIQUIBASE_CONTEXTS=default,ai-detection java -jar bdqm-backend.jar
```

### Disabling AI Tables

If you later disable AI, the tables remain but are not used. To clean up:

```sql
-- Optional: Remove AI tables if no longer needed
DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS ai_cluster_members CASCADE;
DROP TABLE IF EXISTS ai_clusters CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS ai_risk_scores CASCADE;
DROP TABLE IF EXISTS ai_models CASCADE;

-- Remove AI columns from anomalies (optional)
ALTER TABLE anomalies
    DROP COLUMN IF EXISTS ai_risk_score,
    DROP COLUMN IF EXISTS ai_risk_level,
    DROP COLUMN IF EXISTS ai_suggested_value,
    DROP COLUMN IF EXISTS ai_suggestion_confidence,
    DROP COLUMN IF EXISTS ai_suggestion_source;
```

## Model Management

### Initial Model Deployment

```bash
# Create models directory
mkdir -p ai-service/models

# Copy pre-trained models (or train new ones)
cp trained_models/*.pkl ai-service/models/

# Verify models
ls -la ai-service/models/
# Expected:
# - risk_scorer.pkl
# - suggester_telephone.pkl
# - suggester_num_id.pkl
# - feature_encoder.pkl
```

### Model Updates

```bash
# 1. Train new model version
python training/train_risk_scorer.py \
  --data training_data_2026.csv \
  --output models/risk_scorer_v1.3.0.pkl

# 2. Copy to models directory
cp models/risk_scorer_v1.3.0.pkl ai-service/models/risk_scorer.pkl

# 3. Restart AI service (rolling update)
docker-compose restart ai-detection

# Or in Kubernetes
kubectl rollout restart deployment/ai-detection
```

### Model Versioning

Keep track of model versions in the database:

```sql
INSERT INTO ai_models (model_name, version, trained_at, metrics, is_active)
VALUES (
    'risk_scorer',
    '1.3.0',
    NOW(),
    '{"accuracy": 0.93, "f1": 0.89}',
    true
);

-- Deactivate previous version
UPDATE ai_models
SET is_active = false
WHERE model_name = 'risk_scorer' AND version != '1.3.0';
```

## Monitoring

### Health Checks

```bash
# AI Service health
curl http://localhost:8000/health
# Expected: {"status": "healthy", "models_loaded": true}

# Backend AI status
curl http://localhost:8080/api/ai-detection/status
# Expected: {"enabled": true, "features": {...}}
```

### Metrics

#### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'ai-detection'
    static_configs:
      - targets: ['ai-detection:8000']
    metrics_path: /metrics
```

#### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `scoring_requests_total` | Total scoring requests | N/A |
| `scoring_latency_seconds` | Scoring latency | p99 > 2s |
| `suggestion_requests_total` | Total suggestion requests | N/A |
| `model_errors_total` | Model inference errors | > 10/min |
| `ai_service_health` | Service health (0/1) | = 0 |

### Logging

```bash
# View AI service logs
docker-compose logs -f ai-detection

# View backend AI-related logs
docker-compose logs backend | grep -i "ai\|detection"
```

## Troubleshooting

### AI Module Not Starting

```bash
# Check if feature flag is set
docker-compose exec backend env | grep AI

# Check if AI service is reachable from backend
docker-compose exec backend curl http://ai-detection:8000/health
```

### Models Not Loading

```bash
# Check model files exist
docker-compose exec ai-detection ls -la /app/models

# Check model load errors
docker-compose logs ai-detection | grep -i "error\|failed"
```

### High Latency

```bash
# Check AI service resources
docker stats ai-detection

# Increase workers if CPU-bound
docker-compose exec ai-detection \
  uvicorn app.main:app --workers 8
```

### Fallback Mode

If AI service fails, the system automatically falls back:

```
[WARN] AI risk scoring failed, continuing without scores: Connection refused
[INFO] Validation completed: 100 anomalies created (AI enrichment skipped)
```

To verify fallback is working:

```bash
# Stop AI service
docker-compose stop ai-detection

# Verify backend still works
curl http://localhost:8080/api/anomalies
# Should return anomalies without AI data

# Check logs for fallback messages
docker-compose logs backend | grep "fallback\|skipped"
```

## Rollback Procedure

### Disable AI Module

```bash
# 1. Update environment
export FEATURE_AI_DETECTION=false

# 2. Restart backend
docker-compose restart backend

# 3. Optionally stop AI service
docker-compose stop ai-detection
```

### Full Rollback

```bash
# 1. Disable feature flag
# 2. Restart backend
# 3. (Optional) Clean up AI tables
# 4. (Optional) Remove AI columns from anomalies
```

The system will continue operating normally with SQL-only validation.
