package com.adakalgroup.bdqm.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for correction suggestion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionRequest {

    private Long anomalyId;

    @NotBlank(message = "Field name is required")
    private String fieldName;

    private String currentValue;

    private String errorType;

    private String clientType;

    private String expectedValue;
}
