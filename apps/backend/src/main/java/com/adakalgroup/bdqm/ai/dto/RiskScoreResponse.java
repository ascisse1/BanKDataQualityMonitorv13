package com.adakalgroup.bdqm.ai.dto;

import com.adakalgroup.bdqm.ai.model.RiskFactor;
import com.adakalgroup.bdqm.ai.model.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response containing risk scores for records.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskScoreResponse {

    private List<RiskScoreDto> scores;
    private long processingTimeMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskScoreDto {
        private String clientNumber;
        private double riskScore;
        private double confidence;
        private RiskLevel riskLevel;
        private List<RiskFactor> topRiskFactors;
        private String modelVersion;
        private LocalDateTime computedAt;
    }
}
