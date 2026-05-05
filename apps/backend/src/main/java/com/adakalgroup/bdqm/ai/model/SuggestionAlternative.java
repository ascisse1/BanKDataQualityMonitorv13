package com.adakalgroup.bdqm.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * An alternative correction suggestion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionAlternative implements Serializable {

    /**
     * Alternative suggested value.
     */
    private String value;

    /**
     * Confidence score for this alternative.
     */
    private double confidence;
}
