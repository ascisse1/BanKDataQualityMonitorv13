package com.adakalgroup.bdqm.ai.service;

import com.adakalgroup.bdqm.ai.client.AiDetectionClient;
import com.adakalgroup.bdqm.ai.dto.RiskScoreRequest;
import com.adakalgroup.bdqm.ai.dto.RiskScoreResponse;
import com.adakalgroup.bdqm.ai.fallback.AiFallbackHandler;
import com.adakalgroup.bdqm.ai.model.AiRiskScore;
import com.adakalgroup.bdqm.ai.model.RiskLevel;
import com.adakalgroup.bdqm.ai.repository.AiRiskScoreRepository;
import com.adakalgroup.bdqm.model.Anomaly;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for ML-based risk scoring.
 */
@Slf4j
public class RiskScoringService {

    private final AiDetectionClient client;
    private final AiFallbackHandler fallbackHandler;
    private final AiRiskScoreRepository repository;

    public RiskScoringService(AiDetectionClient client,
                               AiFallbackHandler fallbackHandler,
                               AiRiskScoreRepository repository) {
        this.client = client;
        this.fallbackHandler = fallbackHandler;
        this.repository = repository;
    }

    /**
     * Score records and return risk scores.
     */
    public RiskScoreResponse scoreRecords(RiskScoreRequest request) {
        return fallbackHandler.executeWithFallback(
            () -> client.scoreRecords(request),
            () -> createEmptyResponse(request),
            "scoreRecords"
        );
    }

    /**
     * Enrich anomalies with risk scores.
     */
    public void enrichAnomalies(List<Anomaly> anomalies,
                                 List<Map<String, Object>> records) {
        if (anomalies.isEmpty() || records.isEmpty()) {
            return;
        }

        try {
            // Build request
            RiskScoreRequest request = buildRequest(records);

            // Get scores
            RiskScoreResponse response = scoreRecords(request);

            // Map scores to anomalies
            Map<String, RiskScoreResponse.RiskScoreDto> scoreMap = response.getScores()
                .stream()
                .collect(Collectors.toMap(
                    RiskScoreResponse.RiskScoreDto::getClientNumber,
                    s -> s,
                    (a, b) -> a
                ));

            // Enrich anomalies
            for (Anomaly anomaly : anomalies) {
                RiskScoreResponse.RiskScoreDto score = scoreMap.get(anomaly.getClientNumber());
                if (score != null) {
                    anomaly.setAiRiskScore(BigDecimal.valueOf(score.getRiskScore()));
                    anomaly.setAiRiskLevel(score.getRiskLevel());
                }
            }

            // Save scores for caching
            saveScores(response.getScores());

        } catch (Exception e) {
            log.warn("Failed to enrich anomalies with risk scores: {}", e.getMessage());
            // Don't fail - anomalies will be created without risk scores
        }
    }

    /**
     * Get cached risk score for a client.
     */
    public Optional<AiRiskScore> getCachedScore(String clientNumber) {
        return repository.findLatestByClientNumber(clientNumber, LocalDateTime.now());
    }

    /**
     * Get high-risk records.
     */
    public List<AiRiskScore> getHighRiskRecords() {
        return repository.findByRiskLevelInOrderByRiskScoreDesc(
            List.of(RiskLevel.HIGH, RiskLevel.CRITICAL)
        );
    }

    private RiskScoreRequest buildRequest(List<Map<String, Object>> records) {
        List<RiskScoreRequest.RecordData> recordData = records.stream()
            .map(r -> RiskScoreRequest.RecordData.builder()
                .clientNumber(String.valueOf(r.get("cli")))
                .fields(r)
                .clientType(String.valueOf(r.getOrDefault("type_cli", "INDIVIDUAL")))
                .structureCode(String.valueOf(r.getOrDefault("age", "")))
                .build())
            .toList();

        return RiskScoreRequest.builder()
            .records(recordData)
            .build();
    }

    private void saveScores(List<RiskScoreResponse.RiskScoreDto> scores) {
        List<AiRiskScore> entities = scores.stream()
            .map(s -> AiRiskScore.builder()
                .clientNumber(s.getClientNumber())
                .riskScore(BigDecimal.valueOf(s.getRiskScore()))
                .confidence(BigDecimal.valueOf(s.getConfidence()))
                .riskLevel(s.getRiskLevel())
                .riskFactors(s.getTopRiskFactors())
                .modelVersion(s.getModelVersion())
                .computedAt(s.getComputedAt())
                .expiresAt(LocalDateTime.now().plusHours(24)) // 24h cache
                .build())
            .toList();

        repository.saveAll(entities);
    }

    private RiskScoreResponse createEmptyResponse(RiskScoreRequest request) {
        return RiskScoreResponse.builder()
            .scores(Collections.emptyList())
            .processingTimeMs(0)
            .build();
    }
}
