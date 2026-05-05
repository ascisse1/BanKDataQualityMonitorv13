package com.adakalgroup.bdqm.ai.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request for bulk correction suggestions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSuggestionRequest {

    @NotEmpty(message = "Anomaly IDs list cannot be empty")
    private List<Long> anomalyIds;
}
