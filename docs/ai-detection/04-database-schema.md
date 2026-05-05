# AI Detection Module - Database Schema

## Overview

The AI module uses separate tables prefixed with `ai_`. These tables are only created when the AI module is enabled via Liquibase context.

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│    anomalies     │       │   ai_models      │
│   (existing)     │       │                  │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ 1:N                      │ references
         │                          │
┌────────▼─────────┐       ┌────────▼─────────┐
│ ai_risk_scores   │       │  ai_suggestions  │
│                  │       │                  │
└──────────────────┘       └────────┬─────────┘
                                    │
                                    │ 1:N
                                    │
                           ┌────────▼─────────┐
                           │  ai_feedback     │
                           │                  │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   ai_clusters    │ 1:N   │ai_cluster_members│
│                  │◀──────│                  │
└──────────────────┘       └──────────────────┘
```

## Tables

### ai_risk_scores

Stores computed risk scores for client records.

```sql
CREATE TABLE ai_risk_scores (
    id                 BIGSERIAL PRIMARY KEY,
    client_number      VARCHAR(50) NOT NULL,
    risk_score         DECIMAL(5,4) NOT NULL,
    confidence         DECIMAL(5,4),
    risk_level         VARCHAR(20),
    risk_factors       JSONB,
    model_version      VARCHAR(20),
    computed_at        TIMESTAMP DEFAULT NOW(),
    expires_at         TIMESTAMP,
    created_at         TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uk_ai_risk_client_model
        UNIQUE (client_number, model_version)
);

CREATE INDEX idx_ai_risk_scores_client
    ON ai_risk_scores(client_number);
CREATE INDEX idx_ai_risk_scores_level
    ON ai_risk_scores(risk_level);
CREATE INDEX idx_ai_risk_scores_expires
    ON ai_risk_scores(expires_at);
```

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| client_number | VARCHAR(50) | Client identifier from CBS |
| risk_score | DECIMAL(5,4) | Score between 0.0000 and 1.0000 |
| confidence | DECIMAL(5,4) | Model confidence in the score |
| risk_level | VARCHAR(20) | LOW, MEDIUM, HIGH, CRITICAL |
| risk_factors | JSONB | Array of {field, reason, contribution} |
| model_version | VARCHAR(20) | Version of model that generated score |
| computed_at | TIMESTAMP | When score was computed |
| expires_at | TIMESTAMP | TTL for cache invalidation |

**risk_factors JSONB structure:**

```json
[
  {
    "field": "num_id",
    "reason": "Pattern deviation from valid IDs",
    "contribution": 0.35
  },
  {
    "field": "telephone",
    "reason": "Missing country code prefix",
    "contribution": 0.28
  }
]
```

---

### ai_suggestions

Stores ML-generated correction suggestions.

```sql
CREATE TABLE ai_suggestions (
    id                 BIGSERIAL PRIMARY KEY,
    anomaly_id         BIGINT NOT NULL,
    suggested_value    VARCHAR(500),
    confidence         DECIMAL(5,4),
    confidence_level   VARCHAR(20),
    source             VARCHAR(30) NOT NULL,
    alternatives       JSONB,
    explanation        TEXT,
    model_version      VARCHAR(20),
    was_accepted       BOOLEAN,
    accepted_at        TIMESTAMP,
    created_at         TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_ai_suggestions_anomaly
        FOREIGN KEY (anomaly_id)
        REFERENCES anomalies(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_suggestions_anomaly
    ON ai_suggestions(anomaly_id);
CREATE INDEX idx_ai_suggestions_accepted
    ON ai_suggestions(was_accepted);
CREATE INDEX idx_ai_suggestions_source
    ON ai_suggestions(source);
```

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| anomaly_id | BIGINT | FK to anomalies table |
| suggested_value | VARCHAR(500) | The suggested correction value |
| confidence | DECIMAL(5,4) | Confidence score (0-1) |
| confidence_level | VARCHAR(20) | LOW, MEDIUM, HIGH |
| source | VARCHAR(30) | ML_MODEL, LLM_FALLBACK, PATTERN_BASED |
| alternatives | JSONB | Other possible values |
| explanation | TEXT | Human-readable explanation |
| model_version | VARCHAR(20) | Model that generated suggestion |
| was_accepted | BOOLEAN | User feedback (null = pending) |
| accepted_at | TIMESTAMP | When feedback was provided |

**alternatives JSONB structure:**

```json
[
  {"value": "06123456", "confidence": 0.45},
  {"value": "+33606123456", "confidence": 0.32}
]
```

---

### ai_feedback

Stores detailed user feedback for model retraining.

```sql
CREATE TABLE ai_feedback (
    id                 BIGSERIAL PRIMARY KEY,
    suggestion_id      BIGINT NOT NULL,
    user_id            VARCHAR(100),
    accepted           BOOLEAN NOT NULL,
    actual_value       VARCHAR(500),
    comment            TEXT,
    created_at         TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_ai_feedback_suggestion
        FOREIGN KEY (suggestion_id)
        REFERENCES ai_suggestions(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_feedback_suggestion
    ON ai_feedback(suggestion_id);
CREATE INDEX idx_ai_feedback_accepted
    ON ai_feedback(accepted);
```

---

### ai_clusters

Stores anomaly clusters for root cause analysis.

```sql
CREATE TABLE ai_clusters (
    id                      BIGSERIAL PRIMARY KEY,
    cluster_label           VARCHAR(100) NOT NULL,
    description             TEXT,
    anomaly_count           INT NOT NULL DEFAULT 0,
    fields                  JSONB,
    error_types             JSONB,
    agencies                JSONB,
    client_types            JSONB,
    root_cause_hypothesis   TEXT,
    trend                   VARCHAR(20),
    first_seen              TIMESTAMP,
    last_seen               TIMESTAMP,
    computed_at             TIMESTAMP DEFAULT NOW(),
    is_active               BOOLEAN DEFAULT TRUE,

    CONSTRAINT uk_ai_clusters_label_date
        UNIQUE (cluster_label, computed_at)
);

CREATE INDEX idx_ai_clusters_active
    ON ai_clusters(is_active);
CREATE INDEX idx_ai_clusters_computed
    ON ai_clusters(computed_at DESC);
```

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| cluster_label | VARCHAR(100) | Human-readable cluster name |
| description | TEXT | Detailed description |
| anomaly_count | INT | Number of anomalies in cluster |
| fields | JSONB | Array of affected field names |
| error_types | JSONB | Array of error types |
| agencies | JSONB | Array of {code, count} |
| client_types | JSONB | Array of {type, count} |
| root_cause_hypothesis | TEXT | AI-generated root cause |
| trend | VARCHAR(20) | INCREASING, DECREASING, STABLE |

---

### ai_cluster_members

Maps anomalies to clusters.

```sql
CREATE TABLE ai_cluster_members (
    cluster_id         BIGINT NOT NULL,
    anomaly_id         BIGINT NOT NULL,
    similarity_score   DECIMAL(5,4),
    added_at           TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (cluster_id, anomaly_id),

    CONSTRAINT fk_ai_cluster_members_cluster
        FOREIGN KEY (cluster_id)
        REFERENCES ai_clusters(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_cluster_members_anomaly
        FOREIGN KEY (anomaly_id)
        REFERENCES anomalies(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_cluster_members_anomaly
    ON ai_cluster_members(anomaly_id);
```

---

### ai_models

Registry of ML models.

```sql
CREATE TABLE ai_models (
    id                 BIGSERIAL PRIMARY KEY,
    model_name         VARCHAR(100) NOT NULL,
    model_type         VARCHAR(50),
    version            VARCHAR(20) NOT NULL,
    description        TEXT,
    trained_at         TIMESTAMP,
    metrics            JSONB,
    training_data_size INT,
    feature_count      INT,
    model_path         VARCHAR(255),
    is_active          BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uk_ai_models_name_version
        UNIQUE (model_name, version)
);

CREATE INDEX idx_ai_models_active
    ON ai_models(is_active);
CREATE INDEX idx_ai_models_name
    ON ai_models(model_name);
```

**metrics JSONB structure:**

```json
{
  "accuracy": 0.923,
  "precision": 0.891,
  "recall": 0.876,
  "f1Score": 0.883,
  "auc": 0.945
}
```

---

## Liquibase Changelog

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.0.xsd">

    <!-- AI Detection Module Tables -->
    <!-- Only applied when context includes 'ai-detection' -->

    <changeSet id="ai-001" author="bdqm" context="ai-detection">
        <comment>Create AI risk scores table</comment>
        <sqlFile path="db/changelog/ai-detection/001-create-ai-risk-scores.sql"/>
    </changeSet>

    <changeSet id="ai-002" author="bdqm" context="ai-detection">
        <comment>Create AI suggestions table</comment>
        <sqlFile path="db/changelog/ai-detection/002-create-ai-suggestions.sql"/>
    </changeSet>

    <changeSet id="ai-003" author="bdqm" context="ai-detection">
        <comment>Create AI feedback table</comment>
        <sqlFile path="db/changelog/ai-detection/003-create-ai-feedback.sql"/>
    </changeSet>

    <changeSet id="ai-004" author="bdqm" context="ai-detection">
        <comment>Create AI clusters tables</comment>
        <sqlFile path="db/changelog/ai-detection/004-create-ai-clusters.sql"/>
    </changeSet>

    <changeSet id="ai-005" author="bdqm" context="ai-detection">
        <comment>Create AI models registry</comment>
        <sqlFile path="db/changelog/ai-detection/005-create-ai-models.sql"/>
    </changeSet>

</databaseChangeLog>
```

**Running migrations with AI context:**

```bash
# Enable AI tables during migration
java -jar app.jar --spring.liquibase.contexts=default,ai-detection
```

---

## JPA Entities

### AiRiskScore.java

```java
@Entity
@Table(name = "ai_risk_scores")
public class AiRiskScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_number", nullable = false)
    private String clientNumber;

    @Column(name = "risk_score", nullable = false)
    private BigDecimal riskScore;

    @Column(name = "confidence")
    private BigDecimal confidence;

    @Column(name = "risk_level")
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Type(JsonType.class)
    @Column(name = "risk_factors", columnDefinition = "jsonb")
    private List<RiskFactor> riskFactors;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
```

### AiSuggestion.java

```java
@Entity
@Table(name = "ai_suggestions")
public class AiSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anomaly_id", nullable = false)
    private Anomaly anomaly;

    @Column(name = "suggested_value")
    private String suggestedValue;

    @Column(name = "confidence")
    private BigDecimal confidence;

    @Column(name = "confidence_level")
    @Enumerated(EnumType.STRING)
    private ConfidenceLevel confidenceLevel;

    @Column(name = "source", nullable = false)
    @Enumerated(EnumType.STRING)
    private SuggestionSource source;

    @Type(JsonType.class)
    @Column(name = "alternatives", columnDefinition = "jsonb")
    private List<SuggestionAlternative> alternatives;

    @Column(name = "explanation")
    private String explanation;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "was_accepted")
    private Boolean wasAccepted;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
}
```
