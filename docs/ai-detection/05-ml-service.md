# AI Detection Module - ML Service

## Overview

The ML Service is a Python FastAPI microservice that provides machine learning inference for risk scoring and correction suggestions.

## Technology Stack

- **Framework:** FastAPI 0.110+
- **ML Libraries:** scikit-learn, XGBoost, pandas, numpy
- **Model Serialization:** joblib, ONNX (optional)
- **API Documentation:** OpenAPI 3.0 (auto-generated)
- **Containerization:** Docker

## Project Structure

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py       # Health check endpoints
│   │   │   ├── scoring.py      # Risk scoring endpoints
│   │   │   ├── suggestions.py  # Correction suggestions
│   │   │   └── clusters.py     # Clustering endpoints
│   │   └── deps.py             # Dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── risk_scorer.py      # Risk scoring model
│   │   ├── suggester.py        # Correction suggester
│   │   └── clusterer.py        # Anomaly clustering
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── scoring.py          # Pydantic models for scoring
│   │   ├── suggestions.py      # Pydantic models for suggestions
│   │   └── common.py           # Shared schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── feature_extractor.py
│   │   ├── model_loader.py
│   │   └── prediction_service.py
│   └── utils/
│       ├── __init__.py
│       └── preprocessing.py
├── models/                      # Trained model files
│   ├── risk_scorer.pkl
│   ├── suggester_telephone.pkl
│   ├── suggester_num_id.pkl
│   └── feature_encoder.pkl
├── training/                    # Training scripts
│   ├── train_risk_scorer.py
│   ├── train_suggester.py
│   └── evaluate_models.py
├── tests/
│   ├── __init__.py
│   ├── test_scoring.py
│   └── test_suggestions.py
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── README.md
```

## API Endpoints

### Health Check

```python
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": model_loader.all_loaded(),
        "timestamp": datetime.utcnow().isoformat()
    }
```

### Risk Scoring

```python
@router.post("/score", response_model=ScoringResponse)
async def score_records(request: ScoringRequest):
    """
    Score records for anomaly risk.

    Args:
        request: List of records with client data

    Returns:
        Risk scores with contributing factors
    """
    scores = []
    for record in request.records:
        features = feature_extractor.extract(record)
        score, factors = risk_scorer.predict(features)
        scores.append(RiskScore(
            client_number=record.client_number,
            risk_score=score,
            risk_factors=factors
        ))
    return ScoringResponse(scores=scores)
```

### Correction Suggestions

```python
@router.post("/suggest", response_model=SuggestionResponse)
async def suggest_correction(request: SuggestionRequest):
    """
    Generate correction suggestion for an anomaly.

    Args:
        request: Anomaly details including field and current value

    Returns:
        Suggested correction with confidence
    """
    # Get field-specific model
    model = model_loader.get_suggester(request.field_name)

    if model is None:
        # Fall back to pattern-based suggestion
        return pattern_suggester.suggest(request)

    suggestion = model.predict(
        current_value=request.current_value,
        error_type=request.error_type,
        client_type=request.client_type
    )

    return SuggestionResponse(
        suggested_value=suggestion.value,
        confidence=suggestion.confidence,
        source="ML_MODEL"
    )
```

## Models

### Risk Scorer

**Algorithm:** XGBoost Classifier

**Features:**
1. `field_completeness` - Percentage of non-null fields (0-1)
2. `value_length_zscore` - Z-score of value length vs mean
3. `pattern_match_score` - Regex pattern conformance (0-1)
4. `historical_anomaly_rate` - Client's past anomaly rate
5. `field_anomaly_rate` - Field's overall anomaly rate
6. `agency_risk_factor` - Agency's historical anomaly rate
7. `client_type_encoded` - One-hot encoded client type
8. `days_since_last_update` - Data staleness indicator
9. `is_placeholder` - Contains X, ?, N/A patterns
10. `digit_ratio` - Ratio of digits to total characters

**Training:**

```python
# training/train_risk_scorer.py

def train_risk_scorer(data_path: str, output_path: str):
    # Load training data
    df = pd.read_csv(data_path)

    # Feature engineering
    X = extract_features(df)
    y = df['had_anomaly'].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train XGBoost
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='binary:logistic'
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict_proba(X_test)[:, 1]
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred > 0.5),
        'auc': roc_auc_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred > 0.5),
        'recall': recall_score(y_test, y_pred > 0.5)
    }

    # Save model
    joblib.dump(model, output_path)

    return metrics
```

### Correction Suggester

**Algorithm:** Per-field models using:
- Pattern-based rules for structured fields
- Sequence-to-sequence for text transformations
- Classification for categorical fields

**Training Data Query:**

```sql
SELECT
    field_name,
    error_type,
    client_type,
    current_value,
    correction_value,
    LENGTH(current_value) as val_length,
    REGEXP_REPLACE(current_value, '[0-9]', 'D', 'g') as pattern
FROM anomalies
WHERE status = 'CORRECTED'
AND correction_value IS NOT NULL
AND corrected_at >= NOW() - INTERVAL '12 months';
```

**Field-Specific Models:**

| Field | Model Type | Example Transformation |
|-------|------------|----------------------|
| telephone | Pattern + Prefix | `06123456` → `+22106123456` |
| email | Suffix completion | `user@gmail` → `user@gmail.com` |
| num_id | Padding/Format | `12345XX` → `12345678` |
| date_naissance | Date fixing | `1985-13-25` → `1985-03-25` |
| nom | Case normalization | `dupont` → `DUPONT` |

### Anomaly Clusterer

**Algorithm:** DBSCAN with custom distance metric

**Features for Clustering:**
- TF-IDF of error messages
- One-hot encoded fields
- One-hot encoded error types
- Normalized agency codes
- Temporal features (day of week, hour)

```python
def cluster_anomalies(anomalies: List[Anomaly]) -> List[Cluster]:
    # Extract features
    features = []
    for anomaly in anomalies:
        feat = {
            'field': anomaly.field_name,
            'error_type': anomaly.error_type,
            'agency': anomaly.structure_code,
            'error_message': anomaly.error_message
        }
        features.append(feat)

    # Vectorize
    X = vectorizer.fit_transform(features)

    # Cluster
    clustering = DBSCAN(eps=0.3, min_samples=5)
    labels = clustering.fit_predict(X)

    # Build cluster objects
    clusters = []
    for label in set(labels):
        if label == -1:
            continue  # Skip noise

        members = [a for a, l in zip(anomalies, labels) if l == label]
        cluster = Cluster(
            label=generate_label(members),
            anomaly_count=len(members),
            fields=list(set(m.field_name for m in members)),
            root_cause=infer_root_cause(members)
        )
        clusters.append(cluster)

    return clusters
```

## Configuration

```python
# app/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4

    # Models
    model_path: str = "/app/models"
    risk_scorer_path: str = "risk_scorer.pkl"

    # Scoring
    risk_threshold_low: float = 0.3
    risk_threshold_medium: float = 0.6
    risk_threshold_high: float = 0.8

    # Suggestions
    min_confidence_threshold: float = 0.5
    max_alternatives: int = 3

    # Clustering
    cluster_min_samples: int = 5
    cluster_eps: float = 0.3

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/
COPY models/ ./models/

# Environment
ENV MODEL_PATH=/app/models
ENV LOG_LEVEL=INFO

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt

```
fastapi==0.110.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
pydantic-settings==2.2.0
scikit-learn==1.4.0
xgboost==2.0.3
pandas==2.2.0
numpy==1.26.0
joblib==1.3.2
httpx==0.27.0
python-multipart==0.0.9
```

## Development

### Running Locally

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Running Tests

```bash
pytest tests/ -v
```

### Training Models

```bash
# Export training data from PostgreSQL
psql -h localhost -U bdqm -d bdqm -c "\copy (
    SELECT field_name, error_type, client_type, current_value, correction_value
    FROM anomalies
    WHERE status = 'CORRECTED' AND correction_value IS NOT NULL
) TO 'training_data.csv' CSV HEADER"

# Train risk scorer
python training/train_risk_scorer.py --data training_data.csv --output models/risk_scorer.pkl

# Train field suggesters
python training/train_suggester.py --field telephone --output models/suggester_telephone.pkl
```

## Monitoring

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, generate_latest

SCORING_REQUESTS = Counter('scoring_requests_total', 'Total scoring requests')
SCORING_LATENCY = Histogram('scoring_latency_seconds', 'Scoring latency')
SUGGESTION_REQUESTS = Counter('suggestion_requests_total', 'Total suggestion requests')
MODEL_ERRORS = Counter('model_errors_total', 'Model inference errors', ['model_name'])

@router.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Logging

```python
import logging
from app.config import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```
