package com.adakalgroup.bdqm.ai.dto;

import com.adakalgroup.bdqm.ai.model.ConfidenceLevel;
import com.adakalgroup.bdqm.ai.model.SuggestionAlternative;
import com.adakalgroup.bdqm.ai.model.SuggestionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response containing correction suggestion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionResponse {

    private Long suggestionId;
    private Long anomalyId;
    private String suggestedValue;
    private double confidence;
    private ConfidenceLevel confidenceLevel;
    private SuggestionSource source;
    private List<SuggestionAlternative> alternatives;
    private String explanation;
    private String modelVersion;
    private LocalDateTime generatedAt;
}
