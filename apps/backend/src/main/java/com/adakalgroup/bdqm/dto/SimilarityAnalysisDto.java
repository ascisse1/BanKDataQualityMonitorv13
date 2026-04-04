package com.adakalgroup.bdqm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarityAnalysisDto {
    @JsonProperty("overall_score")
    private double overallScore;

    @JsonProperty("field_scores")
    private List<FieldScoreDto> fieldScores;

    @JsonProperty("matching_fields")
    private List<String> matchingFields;

    @JsonProperty("suspicious_patterns")
    private List<String> suspiciousPatterns;
}
