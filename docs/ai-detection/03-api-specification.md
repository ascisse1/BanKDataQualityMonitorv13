# AI Detection Module - API Specification

## Base URL

```
/api/ai-detection
```

**Note:** All endpoints return `404 Not Found` when `FEATURE_AI_DETECTION=false`.

## Authentication

All endpoints require authentication via the existing OAuth2/Keycloak session.

---

## Endpoints

### GET /status

Check AI module status and health.

**Response:**

```json
{
  "enabled": true,
  "features": {
    "riskScoring": true,
    "correctionSuggestions": true,
    "clustering": false
  },
  "modelStatus": {
    "riskScorer": {
      "version": "1.2.0",
      "healthy": true,
      "lastTrained": "2026-05-01T10:30:00Z"
    },
    "suggester": {
      "version": "1.1.0",
      "healthy": true,
      "lastTrained": "2026-04-28T14:00:00Z"
    }
  },
  "serviceHealth": {
    "mlServiceReachable": true,
    "latencyMs": 45
  }
}
```

**Status Codes:**
- `200 OK` - AI module enabled and healthy
- `404 Not Found` - AI module disabled
- `503 Service Unavailable` - ML service unreachable

---

### POST /score

Get risk scores for records before/during validation.

**Request:**

```json
{
  "records": [
    {
      "clientNumber": "CLI001234",
      "fields": {
        "num_id": "12345XX",
        "nom": "DUPONT",
        "prenom": "Jean",
        "telephone": "06123456",
        "date_naissance": "1985-03-25"
      },
      "clientType": "INDIVIDUAL",
      "structureCode": "AGC_001"
    }
  ]
}
```

**Response:**

```json
{
  "scores": [
    {
      "clientNumber": "CLI001234",
      "riskScore": 0.87,
      "confidence": 0.92,
      "riskLevel": "HIGH",
      "topRiskFactors": [
        {
          "field": "num_id",
          "reason": "Pattern deviation from valid IDs",
          "contribution": 0.35
        },
        {
          "field": "telephone",
          "reason": "Missing country code prefix",
          "contribution": 0.28
        },
        {
          "field": "date_naissance",
          "reason": "No risk detected",
          "contribution": 0.0
        }
      ],
      "modelVersion": "1.2.0",
      "computedAt": "2026-05-04T12:30:45Z"
    }
  ],
  "processingTimeMs": 125
}
```

**Risk Levels:**
- `LOW`: score < 0.3
- `MEDIUM`: 0.3 <= score < 0.6
- `HIGH`: 0.6 <= score < 0.8
- `CRITICAL`: score >= 0.8

**Status Codes:**
- `200 OK` - Scores computed successfully
- `400 Bad Request` - Invalid request format
- `503 Service Unavailable` - ML service error (returns empty scores if fallback enabled)

---

### GET /suggestion/{anomalyId}

Get correction suggestion for a specific anomaly.

**Path Parameters:**
- `anomalyId` (Long) - ID of the anomaly

**Response:**

```json
{
  "anomalyId": 12345,
  "suggestedValue": "+22106123456",
  "confidence": 0.91,
  "confidenceLevel": "HIGH",
  "source": "ML_MODEL",
  "alternatives": [
    {
      "value": "06123456",
      "confidence": 0.45
    },
    {
      "value": "+33606123456",
      "confidence": 0.32
    }
  ],
  "explanation": "Based on 847 similar corrections, phone numbers in this format typically need the +221 country code prefix.",
  "modelVersion": "1.1.0",
  "generatedAt": "2026-05-04T12:31:00Z"
}
```

**Confidence Levels:**
- `LOW`: confidence < 0.5
- `MEDIUM`: 0.5 <= confidence < 0.8
- `HIGH`: confidence >= 0.8

**Source Types:**
- `ML_MODEL` - Suggestion from trained ML model
- `LLM_FALLBACK` - Suggestion from Ollama LLM (when ML model has no data)
- `PATTERN_BASED` - Rule-based pattern transformation

**Status Codes:**
- `200 OK` - Suggestion generated
- `404 Not Found` - Anomaly not found
- `204 No Content` - No suggestion available

---

### POST /suggestion

Get correction suggestions for multiple anomalies.

**Request:**

```json
{
  "anomalyIds": [12345, 12346, 12347]
}
```

**Response:**

```json
{
  "suggestions": [
    {
      "anomalyId": 12345,
      "suggestedValue": "+22106123456",
      "confidence": 0.91,
      "source": "ML_MODEL"
    },
    {
      "anomalyId": 12346,
      "suggestedValue": "DUPONT",
      "confidence": 0.78,
      "source": "ML_MODEL"
    },
    {
      "anomalyId": 12347,
      "suggestedValue": null,
      "confidence": 0.0,
      "source": "NONE",
      "reason": "Insufficient training data for this field"
    }
  ],
  "processingTimeMs": 340
}
```

---

### POST /suggestion/{suggestionId}/feedback

Record user feedback on suggestion (for model retraining).

**Path Parameters:**
- `suggestionId` (Long) - ID of the suggestion record

**Request:**

```json
{
  "accepted": true,
  "actualValue": "+22106123456",
  "comment": "Suggestion was correct"
}
```

**Response:**

```json
{
  "recorded": true,
  "suggestionId": 456,
  "feedbackId": 789
}
```

**Status Codes:**
- `200 OK` - Feedback recorded
- `404 Not Found` - Suggestion not found

---

### GET /clusters

Get anomaly clusters for root cause analysis.

**Query Parameters:**
- `limit` (int, default: 10) - Maximum clusters to return
- `minSize` (int, default: 5) - Minimum anomalies per cluster
- `fromDate` (date, optional) - Filter by creation date

**Response:**

```json
{
  "clusters": [
    {
      "id": 1,
      "label": "Missing ID Documents",
      "description": "Anomalies related to missing or invalid identification documents",
      "anomalyCount": 234,
      "fields": ["num_id", "date_validite_id", "type_piece"],
      "errorTypes": ["REQUIRED", "FORMAT"],
      "agencies": [
        {"code": "AGC_003", "count": 145},
        {"code": "AGC_007", "count": 89}
      ],
      "clientTypes": [
        {"type": "INDIVIDUAL", "count": 210},
        {"type": "CORPORATE", "count": 24}
      ],
      "rootCauseHypothesis": "New onboarding process may have incomplete document capture workflow",
      "trend": "INCREASING",
      "firstSeen": "2026-04-15T00:00:00Z",
      "lastSeen": "2026-05-04T00:00:00Z"
    },
    {
      "id": 2,
      "label": "Phone Format Issues",
      "description": "Phone numbers missing country code or incorrect format",
      "anomalyCount": 156,
      "fields": ["telephone", "telephone_mobile"],
      "errorTypes": ["FORMAT"],
      "agencies": [
        {"code": "AGC_001", "count": 78},
        {"code": "AGC_002", "count": 78}
      ],
      "rootCauseHypothesis": "Data entry form may not enforce country code prefix",
      "trend": "STABLE"
    }
  ],
  "totalClusters": 8,
  "computedAt": "2026-05-04T03:00:00Z",
  "nextComputeAt": "2026-05-05T03:00:00Z"
}
```

**Trend Types:**
- `INCREASING` - More anomalies in recent period
- `DECREASING` - Fewer anomalies in recent period
- `STABLE` - No significant change

---

### GET /clusters/{clusterId}/anomalies

Get anomalies belonging to a specific cluster.

**Path Parameters:**
- `clusterId` (Long) - Cluster ID

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)
- `status` (string, optional) - Filter by anomaly status

**Response:**

```json
{
  "clusterId": 1,
  "clusterLabel": "Missing ID Documents",
  "anomalies": [
    {
      "id": 12345,
      "clientNumber": "CLI001234",
      "fieldName": "num_id",
      "currentValue": null,
      "status": "PENDING",
      "similarityScore": 0.95
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 234,
  "totalPages": 12
}
```

---

### GET /models

Get information about loaded ML models.

**Response:**

```json
{
  "models": [
    {
      "name": "risk_scorer",
      "type": "XGBoost Classifier",
      "version": "1.2.0",
      "trainedAt": "2026-05-01T10:30:00Z",
      "metrics": {
        "accuracy": 0.923,
        "precision": 0.891,
        "recall": 0.876,
        "f1Score": 0.883
      },
      "trainingDataSize": 125000,
      "features": 24,
      "isActive": true
    },
    {
      "name": "suggester_telephone",
      "type": "Seq2Seq Transformer",
      "version": "1.1.0",
      "trainedAt": "2026-04-28T14:00:00Z",
      "metrics": {
        "accuracy": 0.912,
        "exactMatch": 0.847
      },
      "trainingDataSize": 8500,
      "isActive": true
    }
  ]
}
```

---

### POST /models/retrain

Trigger model retraining (admin only).

**Request:**

```json
{
  "modelName": "risk_scorer",
  "includeRecentData": true,
  "fromDate": "2026-01-01"
}
```

**Response:**

```json
{
  "jobId": "retrain-20260504-001",
  "status": "QUEUED",
  "estimatedDuration": "15 minutes",
  "startedAt": null
}
```

**Status Codes:**
- `202 Accepted` - Retraining job queued
- `403 Forbidden` - Admin role required
- `409 Conflict` - Retraining already in progress

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "AI_SERVICE_UNAVAILABLE",
  "message": "ML service is not reachable",
  "timestamp": "2026-05-04T12:30:45Z",
  "path": "/api/ai-detection/score",
  "fallbackUsed": true
}
```

**Error Codes:**
- `AI_MODULE_DISABLED` - Feature flag is false
- `AI_SERVICE_UNAVAILABLE` - ML service unreachable
- `AI_SERVICE_TIMEOUT` - Request timed out
- `AI_MODEL_ERROR` - Model inference failed
- `AI_INVALID_REQUEST` - Invalid input data
