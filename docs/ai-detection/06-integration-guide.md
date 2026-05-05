# AI Detection Module - Integration Guide

## Overview

This guide explains how the AI Detection module integrates with the existing BDQM codebase without breaking the legacy SQL-based validation.

## Integration Points

### 1. CbsValidationService Integration

The main integration point is `CbsValidationService`. The AI module is injected as an **optional dependency**.

**Before (existing code):**

```java
@Service
public class CbsValidationService {
    private final AnomalyRepository anomalyRepository;
    private final ValidationRuleRepository ruleRepository;

    public ValidationResult validateRecords(String tableName,
                                            List<Map<String, Object>> records) {
        // SQL-based validation
        List<Anomaly> anomalies = validateWithRules(tableName, records);
        anomalyRepository.saveAll(anomalies);
        return new ValidationResult(...);
    }
}
```

**After (with optional AI):**

```java
@Service
public class CbsValidationService {
    private final AnomalyRepository anomalyRepository;
    private final ValidationRuleRepository ruleRepository;

    // Optional AI module - only injected if enabled
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

        // 2. AI ENHANCEMENT: Only if enabled
        aiDetectionService.ifPresent(ai -> {
            try {
                ai.enrichAnomalies(anomalies, records);
            } catch (Exception e) {
                log.warn("AI enrichment failed, continuing: {}", e.getMessage());
            }
        });

        // 3. Save anomalies
        anomalyRepository.saveAll(anomalies);

        return new ValidationResult(...);
    }
}
```

### 2. Anomaly Entity Enhancement

Add optional AI-related fields to the `Anomaly` entity:

```java
@Entity
@Table(name = "anomalies")
public class Anomaly {
    // ... existing fields ...

    // AI Enhancement Fields (nullable, optional)
    @Column(name = "ai_risk_score")
    private BigDecimal aiRiskScore;

    @Column(name = "ai_risk_level")
    @Enumerated(EnumType.STRING)
    private RiskLevel aiRiskLevel;

    @Column(name = "ai_suggested_value")
    private String aiSuggestedValue;

    @Column(name = "ai_suggestion_confidence")
    private BigDecimal aiSuggestionConfidence;

    @Column(name = "ai_suggestion_source")
    private String aiSuggestionSource;
}
```

**Migration (optional fields):**

```sql
-- Only add columns, don't break existing data
ALTER TABLE anomalies
    ADD COLUMN IF NOT EXISTS ai_risk_score DECIMAL(5,4),
    ADD COLUMN IF NOT EXISTS ai_risk_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS ai_suggested_value VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ai_suggestion_confidence DECIMAL(5,4),
    ADD COLUMN IF NOT EXISTS ai_suggestion_source VARCHAR(30);
```

### 3. AnomalyService Enhancement

Add methods to fetch AI data when available:

```java
@Service
public class AnomalyService {
    // ... existing code ...

    private final Optional<AiDetectionService> aiDetectionService;

    public AnomalyDto getAnomalyWithAiData(Long id) {
        Anomaly anomaly = anomalyRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Anomaly not found"));

        AnomalyDto dto = mapper.toDto(anomaly);

        // Enrich with AI data if available
        aiDetectionService.ifPresent(ai -> {
            if (anomaly.getAiSuggestedValue() == null) {
                // Generate suggestion on-demand
                ai.suggestCorrection(anomaly).ifPresent(suggestion -> {
                    dto.setAiSuggestedValue(suggestion.getValue());
                    dto.setAiSuggestionConfidence(suggestion.getConfidence());
                });
            }
        });

        return dto;
    }
}
```

### 4. Frontend Integration

#### API Service

```typescript
// services/aiDetectionApi.ts

import { api } from './api';

export interface AiDetectionStatus {
  enabled: boolean;
  features: {
    riskScoring: boolean;
    correctionSuggestions: boolean;
    clustering: boolean;
  };
}

export interface RiskScore {
  clientNumber: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  topRiskFactors: Array<{
    field: string;
    reason: string;
    contribution: number;
  }>;
}

export interface CorrectionSuggestion {
  anomalyId: number;
  suggestedValue: string;
  confidence: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'ML_MODEL' | 'LLM_FALLBACK' | 'PATTERN_BASED';
  alternatives?: Array<{ value: string; confidence: number }>;
}

export const aiDetectionApi = {
  getStatus: () =>
    api.get<AiDetectionStatus>('/api/ai-detection/status'),

  getSuggestion: (anomalyId: number) =>
    api.get<CorrectionSuggestion>(`/api/ai-detection/suggestion/${anomalyId}`),

  submitFeedback: (suggestionId: number, accepted: boolean, actualValue?: string) =>
    api.post(`/api/ai-detection/suggestion/${suggestionId}/feedback`, {
      accepted,
      actualValue
    }),

  getClusters: () =>
    api.get('/api/ai-detection/clusters'),
};
```

#### Feature Detection Hook

```typescript
// hooks/useAiDetection.ts

import { useQuery } from '@tanstack/react-query';
import { aiDetectionApi } from '../services/aiDetectionApi';

export function useAiDetection() {
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['ai-detection-status'],
    queryFn: () => aiDetectionApi.getStatus(),
    staleTime: 60_000, // Recheck every minute
    retry: false, // Don't retry if disabled
  });

  return {
    isLoading,
    isEnabled: status?.enabled ?? false,
    hasRiskScoring: status?.features?.riskScoring ?? false,
    hasSuggestions: status?.features?.correctionSuggestions ?? false,
    hasClustering: status?.features?.clustering ?? false,
    error: error ? 'AI module unavailable' : null,
  };
}
```

#### Suggestion Component

```typescript
// components/ai/CorrectionSuggestion.tsx

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiDetectionApi } from '../../services/aiDetectionApi';
import { useAiDetection } from '../../hooks/useAiDetection';
import { Check, X, Sparkles } from 'lucide-react';

interface Props {
  anomalyId: number;
  onApply: (value: string) => void;
}

export function CorrectionSuggestion({ anomalyId, onApply }: Props) {
  const { hasSuggestions } = useAiDetection();
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data: suggestion, isLoading } = useQuery({
    queryKey: ['ai-suggestion', anomalyId],
    queryFn: () => aiDetectionApi.getSuggestion(anomalyId),
    enabled: hasSuggestions,
  });

  const feedbackMutation = useMutation({
    mutationFn: (accepted: boolean) =>
      aiDetectionApi.submitFeedback(suggestion!.id, accepted),
    onSuccess: () => setFeedbackSent(true),
  });

  if (!hasSuggestions || isLoading || !suggestion) {
    return null;
  }

  const confidenceColor = {
    HIGH: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-gray-500',
  }[suggestion.confidenceLevel];

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
      <Sparkles className="w-4 h-4 text-blue-500" />
      <span className="text-sm">
        Suggestion: <strong>{suggestion.suggestedValue}</strong>
      </span>
      <span className={`text-xs ${confidenceColor}`}>
        ({Math.round(suggestion.confidence * 100)}%)
      </span>

      {!feedbackSent && (
        <>
          <button
            onClick={() => {
              onApply(suggestion.suggestedValue);
              feedbackMutation.mutate(true);
            }}
            className="p-1 hover:bg-green-100 rounded"
            title="Appliquer"
          >
            <Check className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => feedbackMutation.mutate(false)}
            className="p-1 hover:bg-red-100 rounded"
            title="Rejeter"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </>
      )}
    </div>
  );
}
```

#### Conditional Rendering in Anomaly Table

```typescript
// components/anomalies/AnomalyRow.tsx

import { useAiDetection } from '../../hooks/useAiDetection';
import { RiskBadge } from '../ai/RiskBadge';
import { CorrectionSuggestion } from '../ai/CorrectionSuggestion';

export function AnomalyRow({ anomaly, onCorrect }) {
  const { hasRiskScoring, hasSuggestions } = useAiDetection();

  return (
    <tr>
      <td>{anomaly.clientNumber}</td>
      <td>{anomaly.fieldName}</td>
      <td>{anomaly.currentValue}</td>

      {/* Risk Score - only shown if AI enabled */}
      {hasRiskScoring && (
        <td>
          {anomaly.aiRiskScore != null ? (
            <RiskBadge
              score={anomaly.aiRiskScore}
              level={anomaly.aiRiskLevel}
            />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}

      {/* Suggestion - only shown if AI enabled */}
      {hasSuggestions && (
        <td>
          <CorrectionSuggestion
            anomalyId={anomaly.id}
            onApply={(value) => onCorrect(anomaly.id, value)}
          />
        </td>
      )}

      <td>{anomaly.status}</td>
      <td>
        <ActionButtons anomaly={anomaly} />
      </td>
    </tr>
  );
}
```

### 5. Controller Endpoint Security

Ensure AI endpoints follow the same security patterns:

```java
@RestController
@RequestMapping("/api/ai-detection")
@ConditionalOnProperty(
    name = "app.features.ai-detection.enabled",
    havingValue = "true"
)
public class AiDetectionController {

    private final AiDetectionService aiDetectionService;

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiDetectionStatusResponse> getStatus() {
        return ResponseEntity.ok(aiDetectionService.getStatus());
    }

    @PostMapping("/score")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ScoringResponse> scoreRecords(
            @RequestBody @Valid ScoringRequest request) {
        return ResponseEntity.ok(aiDetectionService.scoreRecords(request));
    }

    @GetMapping("/suggestion/{anomalyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SuggestionResponse> getSuggestion(
            @PathVariable Long anomalyId) {
        return aiDetectionService.getSuggestion(anomalyId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/suggestion/{suggestionId}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @PathVariable Long suggestionId,
            @RequestBody @Valid FeedbackRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
            aiDetectionService.recordFeedback(suggestionId, request, user.getUsername())
        );
    }

    @GetMapping("/clusters")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ClustersResponse> getClusters(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "5") int minSize) {
        return ResponseEntity.ok(aiDetectionService.getClusters(limit, minSize));
    }
}
```

## Testing Strategy

### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class CbsValidationServiceTest {

    @Mock
    private AnomalyRepository anomalyRepository;

    @Mock
    private ValidationRuleRepository ruleRepository;

    @Mock
    private AiDetectionService aiDetectionService;

    @Test
    void validateRecords_withAiEnabled_enrichesAnomalies() {
        // Given
        CbsValidationService service = new CbsValidationService(
            anomalyRepository, ruleRepository, aiDetectionService);

        List<Map<String, Object>> records = List.of(
            Map.of("cli", "CLI001", "telephone", "06123456")
        );

        // When
        service.validateRecords("bkcli", records);

        // Then
        verify(aiDetectionService).enrichAnomalies(any(), eq(records));
    }

    @Test
    void validateRecords_withAiDisabled_stillWorks() {
        // Given - AI service is null
        CbsValidationService service = new CbsValidationService(
            anomalyRepository, ruleRepository, null);

        List<Map<String, Object>> records = List.of(
            Map.of("cli", "CLI001", "telephone", "06123456")
        );

        // When - should not throw
        ValidationResult result = service.validateRecords("bkcli", records);

        // Then
        assertNotNull(result);
    }

    @Test
    void validateRecords_whenAiFails_continuesWithoutAi() {
        // Given
        CbsValidationService service = new CbsValidationService(
            anomalyRepository, ruleRepository, aiDetectionService);

        when(aiDetectionService.enrichAnomalies(any(), any()))
            .thenThrow(new AiServiceException("Service unavailable"));

        // When - should not throw
        ValidationResult result = service.validateRecords("bkcli", List.of());

        // Then
        assertNotNull(result);
    }
}
```

### Integration Tests

```java
@SpringBootTest
@TestPropertySource(properties = "app.features.ai-detection.enabled=true")
class AiDetectionIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void getStatus_whenEnabled_returnsStatus() {
        ResponseEntity<AiDetectionStatusResponse> response =
            restTemplate.getForEntity("/api/ai-detection/status",
                                       AiDetectionStatusResponse.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEnabled());
    }
}

@SpringBootTest
@TestPropertySource(properties = "app.features.ai-detection.enabled=false")
class AiDetectionDisabledTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void getStatus_whenDisabled_returns404() {
        ResponseEntity<String> response =
            restTemplate.getForEntity("/api/ai-detection/status", String.class);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
```

## Migration Checklist

- [ ] Add AI module package structure
- [ ] Add feature flag configuration
- [ ] Add optional AI columns to anomalies table
- [ ] Update CbsValidationService with optional AI injection
- [ ] Create AiDetectionController
- [ ] Add Liquibase migrations for AI tables
- [ ] Add frontend hooks and components
- [ ] Update AnomalyRow to conditionally show AI data
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update deployment documentation
