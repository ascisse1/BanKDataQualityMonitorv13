package com.adakalgroup.bdqm.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request to score records for anomaly risk.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskScoreRequest {

    @NotEmpty(message = "Records list cannot be empty")
    @Valid
    private List<RecordData> records;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordData {
        private String clientNumber;
        private Map<String, Object> fields;
        private String clientType;
        private String structureCode;
    }
}
