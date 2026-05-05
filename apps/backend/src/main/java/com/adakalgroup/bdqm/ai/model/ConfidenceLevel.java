package com.adakalgroup.bdqm.ai.model;

/**
 * Confidence level for AI suggestions.
 */
public enum ConfidenceLevel {
    LOW,    // confidence < 0.5
    MEDIUM, // 0.5 <= confidence < 0.8
    HIGH;   // confidence >= 0.8

    /**
     * Determine confidence level from numeric score.
     */
    public static ConfidenceLevel fromScore(double confidence) {
        if (confidence >= 0.8) return HIGH;
        if (confidence >= 0.5) return MEDIUM;
        return LOW;
    }
}
