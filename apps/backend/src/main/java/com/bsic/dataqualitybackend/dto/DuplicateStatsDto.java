package com.bsic.dataqualitybackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateStatsDto {
    @JsonProperty("total_duplicates")
    private long totalDuplicates;

    @JsonProperty("pending_review")
    private long pendingReview;

    private long confirmed;
    private long rejected;
    private long merged;

    @JsonProperty("by_type")
    private Map<String, Long> byType;

    @JsonProperty("high_confidence")
    private long highConfidence;
}
