package com.adakalgroup.bdqm.ai.model;

/**
 * Source of correction suggestion.
 */
public enum SuggestionSource {
    /**
     * Suggestion from trained ML model.
     */
    ML_MODEL,

    /**
     * Fallback suggestion from LLM (Ollama).
     */
    LLM_FALLBACK,

    /**
     * Rule-based pattern transformation.
     */
    PATTERN_BASED,

    /**
     * No suggestion available.
     */
    NONE
}
