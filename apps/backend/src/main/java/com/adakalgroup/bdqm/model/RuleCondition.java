package com.adakalgroup.bdqm.model;

import com.adakalgroup.bdqm.model.enums.NaturalRuleType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Represents a single rule condition in natural language format.
 * Used to parse JSON rule definitions from validation_rules.rule_definition column.
 *
 * Examples:
 * - { "type": "required", "message": "Le champ est obligatoire" }
 * - { "type": "minLength", "value": 8 }
 * - { "type": "forbiddenPatterns", "values": ["XXX", "123", "000"] }
 * - { "type": "inList", "values": ["M", "F"] }
 * - { "type": "dateAfter", "value": "1915-01-01" }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RuleCondition {

    /**
     * Rule type code (e.g., "required", "minLength", "forbiddenPatterns").
     */
    @JsonProperty("type")
    private String type;

    /**
     * Single value for rules that need one parameter.
     * Can be: String (date, prefix), Integer (length), etc.
     */
    @JsonProperty("value")
    private Object value;

    /**
     * List of values for rules that need multiple parameters.
     * Used for: forbiddenPatterns, inList, notInList, etc.
     */
    @JsonProperty("values")
    private List<String> values;

    /**
     * Minimum value for range rules.
     */
    @JsonProperty("min")
    private Object min;

    /**
     * Maximum value for range rules.
     */
    @JsonProperty("max")
    private Object max;

    /**
     * Custom error message for this specific condition.
     * If null, a default message will be generated.
     */
    @JsonProperty("message")
    private String message;

    /**
     * Whether the field is optional for this rule.
     * If true, null/empty values pass validation.
     */
    @JsonProperty("optional")
    @Builder.Default
    private Boolean optional = false;

    // ===== HELPER METHODS =====

    /**
     * Get the NaturalRuleType enum from the type code.
     */
    public NaturalRuleType getRuleType() {
        return NaturalRuleType.fromCode(this.type);
    }

    /**
     * Get value as String.
     */
    public String getStringValue() {
        return value != null ? value.toString() : null;
    }

    /**
     * Get value as Integer.
     */
    public Integer getIntValue() {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Get min as Integer.
     */
    public Integer getMinInt() {
        if (min == null) return null;
        if (min instanceof Number) {
            return ((Number) min).intValue();
        }
        try {
            return Integer.parseInt(min.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Get max as Integer.
     */
    public Integer getMaxInt() {
        if (max == null) return null;
        if (max instanceof Number) {
            return ((Number) max).intValue();
        }
        try {
            return Integer.parseInt(max.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Get min as String (for dates).
     */
    public String getMinString() {
        return min != null ? min.toString() : null;
    }

    /**
     * Get max as String (for dates).
     */
    public String getMaxString() {
        return max != null ? max.toString() : null;
    }

    /**
     * Check if this condition is optional.
     */
    public boolean isOptional() {
        return Boolean.TRUE.equals(optional);
    }
}
