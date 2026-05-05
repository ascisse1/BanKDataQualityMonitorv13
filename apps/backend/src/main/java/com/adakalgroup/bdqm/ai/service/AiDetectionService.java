package com.adakalgroup.bdqm.ai.service;

import com.adakalgroup.bdqm.ai.client.AiDetectionClient;
import com.adakalgroup.bdqm.ai.config.AiDetectionProperties;
import com.adakalgroup.bdqm.ai.dto.*;
import com.adakalgroup.bdqm.ai.fallback.AiFallbackHandler;
import com.adakalgroup.bdqm.ai.model.AiRiskScore;
import com.adakalgroup.bdqm.ai.model.AiSuggestion;
import com.adakalgroup.bdqm.ai.model.RiskLevel;
import com.adakalgroup.bdqm.ai.repository.AiRiskScoreRepository;
import com.adakalgroup.bdqm.ai.repository.AiSuggestionRepository;
import com.adakalgroup.bdqm.model.Anomaly;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Main AI Detection service orchestrating all AI features.
 * Unified AI module combining ML models with Ollama LLM fallback.
 */
@Slf4j
public class AiDetectionService {

    private final AiDetectionClient client;
    private final AiFallbackHandler fallbackHandler;
    private final AnomalyRepository anomalyRepository;
    private final AiRiskScoreRepository riskScoreRepository;
    private final AiSuggestionRepository suggestionRepository;
    private final AiDetectionProperties props;
    private final OllamaService ollamaService;

    public AiDetectionService(AiDetectionClient client,
                               AiFallbackHandler fallbackHandler,
                               AnomalyRepository anomalyRepository,
                               AiRiskScoreRepository riskScoreRepository,
                               AiSuggestionRepository suggestionRepository,
                               AiDetectionProperties props,
                               OllamaService ollamaService) {
        this.client = client;
        this.fallbackHandler = fallbackHandler;
        this.anomalyRepository = anomalyRepository;
        this.riskScoreRepository = riskScoreRepository;
        this.suggestionRepository = suggestionRepository;
        this.props = props;
        this.ollamaService = ollamaService;
    }

    /**
     * Get AI module status.
     */
    public AiDetectionStatusResponse getStatus() {
        AiDetectionClient.HealthResponse health = client.getHealth();
        boolean ollamaAvailable = ollamaService != null && ollamaService.isAvailable();

        Map<String, AiDetectionStatusResponse.ModelStatus> modelStatus = buildModelStatus(health);

        // Add Ollama status
        modelStatus.put("ollama", AiDetectionStatusResponse.ModelStatus.builder()
            .version("ollama-1.0")
            .healthy(ollamaAvailable)
            .build());

        return AiDetectionStatusResponse.builder()
            .enabled(props.isEnabled())
            .features(AiDetectionStatusResponse.Features.builder()
                .riskScoring(props.isRiskScoring())
                .correctionSuggestions(props.isCorrectionSuggestions())
                .clustering(props.isClustering())
                .build())
            .modelStatus(modelStatus)
            .serviceHealth(AiDetectionStatusResponse.ServiceHealth.builder()
                .mlServiceReachable("healthy".equals(health.getStatus()) || ollamaAvailable)
                .latencyMs(health.getLatencyMs())
                .build())
            .build();
    }

    /**
     * Get explanation for an anomaly using Ollama LLM.
     */
    public Optional<String> explainAnomaly(Long anomalyId) {
        if (ollamaService == null) {
            return Optional.empty();
        }

        return anomalyRepository.findById(anomalyId)
            .flatMap(ollamaService::explainAnomaly);
    }

    /**
     * Enrich anomalies with AI data (risk scores and suggestions).
     */
    public void enrichAnomalies(List<Anomaly> anomalies,
                                 List<Map<String, Object>> records) {
        if (!props.isEnabled() || anomalies.isEmpty()) {
            return;
        }

        // Enrich with risk scores
        if (props.isRiskScoring()) {
            enrichWithRiskScores(anomalies, records);
        }

        // Generate suggestions for high-confidence cases
        if (props.isCorrectionSuggestions()) {
            enrichWithSuggestions(anomalies);
        }
    }

    /**
     * Score records for risk.
     */
    public RiskScoreResponse scoreRecords(RiskScoreRequest request) {
        return fallbackHandler.executeWithFallback(
            () -> client.scoreRecords(request),
            () -> RiskScoreResponse.builder()
                .scores(List.of())
                .processingTimeMs(0)
                .build(),
            "scoreRecords"
        );
    }

    /**
     * Get suggestion for an anomaly.
     */
    public Optional<SuggestionResponse> getSuggestion(Long anomalyId) {
        // Check cache first
        Optional<AiSuggestion> cached = suggestionRepository
            .findFirstByAnomalyIdOrderByCreatedAtDesc(anomalyId);

        if (cached.isPresent() && isRecent(cached.get())) {
            return Optional.of(toSuggestionResponse(cached.get()));
        }

        // Generate new suggestion
        return anomalyRepository.findById(anomalyId)
            .flatMap(this::generateSuggestion);
    }

    /**
     * Record feedback on a suggestion.
     */
    public FeedbackResponse recordFeedback(Long suggestionId,
                                            FeedbackRequest request,
                                            String userId) {
        return suggestionRepository.findById(suggestionId)
            .map(suggestion -> {
                suggestion.setWasAccepted(request.getAccepted());
                suggestion.setAcceptedAt(LocalDateTime.now());
                suggestionRepository.save(suggestion);

                log.info("Recorded feedback for suggestion {}: accepted={}, user={}",
                    suggestionId, request.getAccepted(), userId);

                return FeedbackResponse.builder()
                    .recorded(true)
                    .suggestionId(suggestionId)
                    .build();
            })
            .orElse(FeedbackResponse.builder()
                .recorded(false)
                .build());
    }

    /**
     * Get statistics for dashboard.
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Risk score stats
        stats.put("highRiskCount",
            riskScoreRepository.countByRiskLevel(RiskLevel.HIGH) +
            riskScoreRepository.countByRiskLevel(RiskLevel.CRITICAL));

        // Suggestion stats
        stats.put("suggestionsGenerated", suggestionRepository.count());
        stats.put("suggestionsAccepted", suggestionRepository.countByWasAccepted(true));
        stats.put("suggestionsRejected", suggestionRepository.countByWasAccepted(false));

        Double acceptanceRate = suggestionRepository
            .calculateAcceptanceRateSince(LocalDateTime.now().minusDays(30));
        stats.put("acceptanceRate", acceptanceRate != null ? acceptanceRate : 0.0);

        return stats;
    }

    // Private helpers

    private void enrichWithRiskScores(List<Anomaly> anomalies,
                                       List<Map<String, Object>> records) {
        try {
            List<RiskScoreRequest.RecordData> recordData = records.stream()
                .map(r -> RiskScoreRequest.RecordData.builder()
                    .clientNumber(String.valueOf(r.get("cli")))
                    .fields(r)
                    .build())
                .toList();

            RiskScoreRequest request = RiskScoreRequest.builder()
                .records(recordData)
                .build();

            RiskScoreResponse response = scoreRecords(request);

            Map<String, RiskScoreResponse.RiskScoreDto> scoreMap = new HashMap<>();
            for (RiskScoreResponse.RiskScoreDto score : response.getScores()) {
                scoreMap.put(score.getClientNumber(), score);
            }

            for (Anomaly anomaly : anomalies) {
                RiskScoreResponse.RiskScoreDto score = scoreMap.get(anomaly.getClientNumber());
                if (score != null) {
                    anomaly.setAiRiskScore(BigDecimal.valueOf(score.getRiskScore()));
                    anomaly.setAiRiskLevel(score.getRiskLevel());
                }
            }

        } catch (Exception e) {
            log.warn("Failed to enrich with risk scores: {}", e.getMessage());
        }
    }

    private void enrichWithSuggestions(List<Anomaly> anomalies) {
        for (Anomaly anomaly : anomalies) {
            try {
                generateSuggestion(anomaly).ifPresent(suggestion -> {
                    anomaly.setAiSuggestedValue(suggestion.getSuggestedValue());
                    anomaly.setAiSuggestionConfidence(
                        BigDecimal.valueOf(suggestion.getConfidence()));
                    anomaly.setAiSuggestionSource(
                        suggestion.getSource() != null ? suggestion.getSource().name() : null);
                });
            } catch (Exception e) {
                log.debug("Failed to generate suggestion for anomaly {}: {}",
                    anomaly.getId(), e.getMessage());
            }
        }
    }

    private Optional<SuggestionResponse> generateSuggestion(Anomaly anomaly) {
        // Try ML service first
        SuggestionRequest request = SuggestionRequest.builder()
            .anomalyId(anomaly.getId())
            .fieldName(anomaly.getFieldName())
            .currentValue(anomaly.getCurrentValue())
            .errorType(anomaly.getErrorType())
            .clientType(anomaly.getClientType() != null ?
                anomaly.getClientType().name() : null)
            .expectedValue(anomaly.getExpectedValue())
            .build();

        SuggestionResponse response = fallbackHandler.executeWithNullFallback(
            () -> client.getSuggestion(request),
            "getSuggestion"
        );

        // If ML service failed or returned no suggestion, try Ollama fallback
        if ((response == null || response.getSuggestedValue() == null) && ollamaService != null) {
            log.debug("ML service unavailable, falling back to Ollama for anomaly {}", anomaly.getId());
            Optional<SuggestionResponse> ollamaResponse = ollamaService.suggestCorrection(anomaly);
            if (ollamaResponse.isPresent()) {
                response = ollamaResponse.get();
            }
        }

        if (response != null && response.getSuggestedValue() != null) {
            // Save suggestion
            AiSuggestion entity = AiSuggestion.builder()
                .anomaly(anomaly)
                .suggestedValue(response.getSuggestedValue())
                .confidence(BigDecimal.valueOf(response.getConfidence()))
                .confidenceLevel(response.getConfidenceLevel())
                .source(response.getSource())
                .alternatives(response.getAlternatives())
                .explanation(response.getExplanation())
                .modelVersion(response.getModelVersion())
                .build();

            AiSuggestion saved = suggestionRepository.save(entity);
            response.setSuggestionId(saved.getId());

            return Optional.of(response);
        }

        return Optional.empty();
    }

    private Map<String, AiDetectionStatusResponse.ModelStatus> buildModelStatus(
            AiDetectionClient.HealthResponse health) {
        Map<String, AiDetectionStatusResponse.ModelStatus> status = new HashMap<>();

        if (health.getModels() != null) {
            for (Map.Entry<String, Object> entry : health.getModels().entrySet()) {
                if (entry.getValue() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> modelInfo = (Map<String, Object>) entry.getValue();
                    status.put(entry.getKey(), AiDetectionStatusResponse.ModelStatus.builder()
                        .version(String.valueOf(modelInfo.getOrDefault("version", "unknown")))
                        .healthy(Boolean.TRUE.equals(modelInfo.get("healthy")))
                        .build());
                }
            }
        }

        return status;
    }

    private SuggestionResponse toSuggestionResponse(AiSuggestion entity) {
        return SuggestionResponse.builder()
            .suggestionId(entity.getId())
            .anomalyId(entity.getAnomaly().getId())
            .suggestedValue(entity.getSuggestedValue())
            .confidence(entity.getConfidence() != null ?
                entity.getConfidence().doubleValue() : 0)
            .confidenceLevel(entity.getConfidenceLevel())
            .source(entity.getSource())
            .alternatives(entity.getAlternatives())
            .explanation(entity.getExplanation())
            .modelVersion(entity.getModelVersion())
            .generatedAt(entity.getCreatedAt())
            .build();
    }

    private boolean isRecent(AiSuggestion suggestion) {
        return suggestion.getCreatedAt() != null &&
            suggestion.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1));
    }
}
