# AI-Powered Anomaly Detection Module

## Overview

The AI Detection module is an **optional enhancement** to the Bank Data Quality Monitor that provides machine learning-powered anomaly detection, risk scoring, and intelligent correction suggestions.

**Key Principle:** The module is completely optional. The legacy SQL-based validation engine works 100% independently without AI features.

> **Note:** As of v2.0, the previous "Faro" chat assistant has been merged into this unified AI Detection module. Chat functionality has been removed in favor of focused anomaly analysis. The Ollama LLM now serves as a fallback when ML models lack training data.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Risk Scoring | Pre-validation ML scoring to prioritize high-risk records | Implemented |
| Correction Suggestions | ML + Ollama LLM hybrid suggestions for fixing anomalies | Implemented |
| Anomaly Explanations | Natural language explanations via Ollama LLM | Implemented |
| False Positive Detection | Identify likely false positives | Phase 2 |
| Anomaly Clustering | Group similar anomalies for root cause analysis | Phase 2 |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CBS Data ──▶ SQL Rule Engine ──▶ Anomalies                    │
│                    │                                            │
│                    │  (if FEATURE_AI_DETECTION = true)          │
│                    ▼                                            │
│              ┌─────────────────────────────────────┐           │
│              │         AI Detection Module         │           │
│              ├─────────────────────────────────────┤           │
│              │  1. ML Service (Python/FastAPI)     │           │
│              │     - Risk scoring (XGBoost)        │           │
│              │     - Correction suggestions        │           │
│              │                                     │           │
│              │  2. Ollama LLM (Fallback)           │           │
│              │     - Anomaly explanations          │           │
│              │     - Suggestions when ML lacks data│           │
│              └─────────────────────────────────────┘           │
│                                                                 │
│  Legacy SQL works 100% WITHOUT AI module                        │
└─────────────────────────────────────────────────────────────────┘
```

### Fallback Strategy

The AI module uses a multi-tier approach:

1. **ML Service (Primary):** Fast, trained models for risk scoring and suggestions
2. **Ollama LLM (Fallback):** When ML models lack training data or are unavailable
3. **Graceful Degradation:** If both fail, system continues without AI enrichment

## Quick Start

### Enable the Module

Set the following environment variables:

```bash
FEATURE_AI_DETECTION=true
AI_SERVICE_URL=http://localhost:8000
```

### Disable the Module (Default)

```bash
FEATURE_AI_DETECTION=false
```

When disabled, all AI-related endpoints return 404 and no AI processing occurs.

## Documentation Index

- [Architecture](./01-architecture.md) - System design and components
- [Configuration](./02-configuration.md) - Environment variables and settings
- [API Specification](./03-api-specification.md) - REST API endpoints
- [Database Schema](./04-database-schema.md) - AI module tables
- [ML Service](./05-ml-service.md) - Python microservice documentation
- [Integration Guide](./06-integration-guide.md) - How to integrate with existing code
- [Deployment](./07-deployment.md) - Deployment and operations guide

## Module Boundaries

| Aspect | Core (SQL) | AI Module |
|--------|------------|-----------|
| Activation | Always ON | FEATURE_AI_DETECTION=true |
| Detection | Rule-based | ML scoring |
| Suggestions | None | ML + Ollama LLM hybrid |
| Explanations | None | Ollama LLM natural language |
| Dependencies | PostgreSQL only | + Python ML service + Ollama |
| Failure Impact | System stops | Graceful fallback to Core |
| Tables | anomalies, validation_rules | ai_risk_scores, ai_suggestions |
| API Prefix | /api/anomalies, /api/validation | /api/ai-detection/* |

## Migration from Faro

If you were using the previous Faro chat assistant, note the following changes:

| Faro (Deprecated) | AI Detection Module |
|-------------------|---------------------|
| `FARO_ENABLED=true` | `FEATURE_AI_DETECTION=true` |
| `/api/ai/chat` | Removed (no chat) |
| `/api/ai/explain-anomaly` | `/api/ai-detection/anomalies/{id}/explanation` |
| `/api/ai/suggest-correction` | `/api/ai-detection/anomalies/{id}/suggestion` |
| AiChatWidget component | Removed (use RiskBadge, CorrectionSuggestion) |

The Faro classes remain in the codebase marked as `@Deprecated` for backwards compatibility but will be removed in a future release.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025 | Unified AI module: Faro merged, chat removed, Ollama LLM fallback |
| 1.0.0 | TBD | Initial release with risk scoring and suggestions |
