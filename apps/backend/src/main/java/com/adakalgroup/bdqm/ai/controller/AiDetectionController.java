package com.adakalgroup.bdqm.ai.controller;

import com.adakalgroup.bdqm.ai.dto.*;
import com.adakalgroup.bdqm.ai.service.AiDetectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for AI Detection module.
 * All endpoints are only available when AI detection is enabled.
 */
@RestController
@RequestMapping("/api/ai-detection")
@ConditionalOnProperty(
    name = "app.features.ai-detection.enabled",
    havingValue = "true"
)
@RequiredArgsConstructor
@Slf4j
public class AiDetectionController {

    private final AiDetectionService aiDetectionService;

    /**
     * Get AI module status.
     */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiDetectionStatusResponse> getStatus() {
        log.debug("Getting AI detection status");
        return ResponseEntity.ok(aiDetectionService.getStatus());
    }

    /**
     * Score records for risk.
     */
    @PostMapping("/score")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<RiskScoreResponse> scoreRecords(
            @RequestBody @Valid RiskScoreRequest request) {
        log.debug("Scoring {} records", request.getRecords().size());
        return ResponseEntity.ok(aiDetectionService.scoreRecords(request));
    }

    /**
     * Get correction suggestion for an anomaly.
     */
    @GetMapping("/suggestion/{anomalyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SuggestionResponse> getSuggestion(
            @PathVariable Long anomalyId) {
        log.debug("Getting suggestion for anomaly {}", anomalyId);
        return aiDetectionService.getSuggestion(anomalyId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Get bulk suggestions for multiple anomalies.
     */
    @PostMapping("/suggestion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BulkSuggestionResponse> getBulkSuggestions(
            @RequestBody @Valid BulkSuggestionRequest request) {
        log.debug("Getting suggestions for {} anomalies", request.getAnomalyIds().size());

        // For now, get suggestions one by one
        // TODO: Implement true bulk endpoint in ML service
        var suggestions = request.getAnomalyIds().stream()
            .map(id -> aiDetectionService.getSuggestion(id)
                .map(s -> BulkSuggestionResponse.SuggestionItem.builder()
                    .anomalyId(id)
                    .suggestedValue(s.getSuggestedValue())
                    .confidence(s.getConfidence())
                    .source(s.getSource())
                    .build())
                .orElse(BulkSuggestionResponse.SuggestionItem.builder()
                    .anomalyId(id)
                    .confidence(0)
                    .reason("No suggestion available")
                    .build()))
            .toList();

        return ResponseEntity.ok(BulkSuggestionResponse.builder()
            .suggestions(suggestions)
            .processingTimeMs(0)
            .build());
    }

    /**
     * Submit feedback on a suggestion.
     */
    @PostMapping("/suggestion/{suggestionId}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @PathVariable Long suggestionId,
            @RequestBody @Valid FeedbackRequest request,
            @AuthenticationPrincipal UserDetails user) {
        log.debug("Recording feedback for suggestion {} from user {}",
            suggestionId, user.getUsername());
        return ResponseEntity.ok(
            aiDetectionService.recordFeedback(suggestionId, request, user.getUsername())
        );
    }

    /**
     * Get AI statistics for dashboard.
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.debug("Getting AI statistics");
        return ResponseEntity.ok(aiDetectionService.getStatistics());
    }
}
