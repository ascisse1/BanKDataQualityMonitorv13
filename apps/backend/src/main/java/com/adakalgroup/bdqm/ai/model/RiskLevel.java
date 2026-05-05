package com.adakalgroup.bdqm.ai.model;

/**
 * Risk level classification based on risk score.
 */
public enum RiskLevel {
    LOW,      // score < 0.3
    MEDIUM,   // 0.3 <= score < 0.6
    HIGH,     // 0.6 <= score < 0.8
    CRITICAL; // score >= 0.8

    /**
     * Determine risk level from numeric score.
     */
    public static RiskLevel fromScore(double score) {
        if (score >= 0.8) return CRITICAL;
        if (score >= 0.6) return HIGH;
        if (score >= 0.3) return MEDIUM;
        return LOW;
    }
}
