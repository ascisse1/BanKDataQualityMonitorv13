package com.adakalgroup.bdqm.ai.service;

import com.adakalgroup.bdqm.ai.client.AiDetectionClient;
import com.adakalgroup.bdqm.ai.dto.*;
import com.adakalgroup.bdqm.ai.fallback.AiFallbackHandler;
import com.adakalgroup.bdqm.ai.model.*;
import com.adakalgroup.bdqm.ai.repository.AiSuggestionRepository;
import com.adakalgroup.bdqm.model.Anomaly;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for ML-based correction suggestions.
 */
@Slf4j
public class CorrectionSuggestionService {

    private final AiDetectionClient client;
    private final AiFallbackHandler fallbackHandler;
    private final AiSuggestionRepository repository;

    @Autowired(required = false)
    private AnomalyRepository anomalyRepository;

    public CorrectionSuggestionService(AiDetectionClient client,
                                        AiFallbackHandler fallbackHandler,
                                        AiSuggestionRepository repository) {
        this.client = client;
        this.fallbackHandler = fallbackHandler;
        this.repository = repository;
    }

    /**
     * Get suggestion for an anomaly by ID.
     */
    public Optional<SuggestionResponse> getSuggestion(Long anomalyId) {
        // Check cache first
        Optional<AiSuggestion> cached = repository.findFirstByAnomalyIdOrderByCreatedAtDesc(anomalyId);
        if (cached.isPresent() && isRecent(cached.get())) {
            return Optional.of(toResponse(cached.get()));
        }

        // Load anomaly and generate suggestion
        if (anomalyRepository == null) {
            return Optional.empty();
        }

        return anomalyRepository.findById(anomalyId)
            .flatMap(this::generateSuggestion);
    }

    /**
     * Generate suggestion for an anomaly.
     */
    public Optional<SuggestionResponse> generateSuggestion(Anomaly anomaly) {
        SuggestionRequest request = SuggestionRequest.builder()
            .anomalyId(anomaly.getId())
            .fieldName(anomaly.getFieldName())
            .currentValue(anomaly.getCurrentValue())
            .errorType(anomaly.getErrorType())
            .clientType(anomaly.getClientType() != null ?
                anomaly.getClientType().name() : null)
            .expectedValue(anomaly.getExpectedValue())
            .build();

        SuggestionResponse response = fallbackHandler.executeWithFallback(
            () -> client.getSuggestion(request),
            () -> null,
            "getSuggestion"
        );

        if (response != null && response.getSuggestedValue() != null) {
            // Save suggestion
            AiSuggestion entity = saveSuggestion(anomaly, response);
            response.setSuggestionId(entity.getId());
            return Optional.of(response);
        }

        return Optional.empty();
    }

    /**
     * Get bulk suggestions.
     */
    public BulkSuggestionResponse getBulkSuggestions(List<Long> anomalyIds) {
        BulkSuggestionRequest request = BulkSuggestionRequest.builder()
            .anomalyIds(anomalyIds)
            .build();

        return fallbackHandler.executeWithFallback(
            () -> client.getBulkSuggestions(request),
            () -> BulkSuggestionResponse.builder()
                .suggestions(List.of())
                .processingTimeMs(0)
                .build(),
            "getBulkSuggestions"
        );
    }

    /**
     * Record feedback on a suggestion.
     */
    public void recordFeedback(Long suggestionId, boolean accepted, String actualValue) {
        repository.findById(suggestionId).ifPresent(suggestion -> {
            suggestion.recordFeedback(accepted);
            repository.save(suggestion);
            log.info("Recorded feedback for suggestion {}: accepted={}",
                suggestionId, accepted);
        });
    }

    /**
     * Get suggestion acceptance rate.
     */
    public Double getAcceptanceRate(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return repository.calculateAcceptanceRateSince(since);
    }

    private AiSuggestion saveSuggestion(Anomaly anomaly, SuggestionResponse response) {
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

        return repository.save(entity);
    }

    private SuggestionResponse toResponse(AiSuggestion entity) {
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
        // Consider suggestions valid for 1 hour
        return suggestion.getCreatedAt() != null &&
            suggestion.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1));
    }
}
