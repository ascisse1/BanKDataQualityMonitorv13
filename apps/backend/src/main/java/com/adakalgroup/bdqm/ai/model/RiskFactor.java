package com.adakalgroup.bdqm.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * A factor contributing to risk score.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskFactor implements Serializable {

    /**
     * Field name that contributes to risk.
     */
    private String field;

    /**
     * Human-readable reason for risk.
     */
    private String reason;

    /**
     * Contribution to overall risk score (0-1).
     */
    private double contribution;
}
