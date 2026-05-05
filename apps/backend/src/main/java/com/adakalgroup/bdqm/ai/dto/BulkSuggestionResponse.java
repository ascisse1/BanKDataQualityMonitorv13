package com.adakalgroup.bdqm.ai.dto;

import com.adakalgroup.bdqm.ai.model.SuggestionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response containing bulk correction suggestions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSuggestionResponse {

    private List<SuggestionItem> suggestions;
    private long processingTimeMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestionItem {
        private Long anomalyId;
        private String suggestedValue;
        private double confidence;
        private SuggestionSource source;
        private String reason;
    }
}
