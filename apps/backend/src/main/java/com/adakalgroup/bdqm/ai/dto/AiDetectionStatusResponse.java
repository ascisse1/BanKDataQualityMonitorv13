package com.adakalgroup.bdqm.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response containing AI module status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDetectionStatusResponse {

    private boolean enabled;
    private Features features;
    private Map<String, ModelStatus> modelStatus;
    private ServiceHealth serviceHealth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Features {
        private boolean riskScoring;
        private boolean correctionSuggestions;
        private boolean clustering;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelStatus {
        private String version;
        private boolean healthy;
        private LocalDateTime lastTrained;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceHealth {
        private boolean mlServiceReachable;
        private long latencyMs;
    }
}
