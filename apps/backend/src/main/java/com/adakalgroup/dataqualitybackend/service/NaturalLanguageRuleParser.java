package com.adakalgroup.dataqualitybackend.service;

import com.adakalgroup.dataqualitybackend.model.RuleCondition;
import com.adakalgroup.dataqualitybackend.model.enums.NaturalRuleType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Service for validating field values against natural language rule conditions.
 * Provides human-readable validation without complex SQL expressions.
 */
@Service
@Slf4j
public class NaturalLanguageRuleParser {

    // Predefined patterns
    private static final Pattern ALPHANUMERIC_PATTERN = Pattern.compile("^[A-Za-z0-9]+$");
    private static final Pattern ALPHA_ONLY_PATTERN = Pattern.compile("^[A-Za-z\\s]+$");
    private static final Pattern NUMERIC_ONLY_PATTERN = Pattern.compile("^[0-9]+$");
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("^[A-Z0-9\\s]+$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+]?[0-9\\s\\-()]{8,20}$");
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("^[Xx]+$");

    /**
     * Validate a field value against a single rule condition.
     *
     * @param value     The field value to validate (can be any type)
     * @param condition The rule condition to check against
     * @return ValidationResult with pass/fail status and message
     */
    public ValidationResult validate(Object value, RuleCondition condition) {
        String strValue = normalizeString(value);
        NaturalRuleType ruleType;

        try {
            ruleType = condition.getRuleType();
        } catch (IllegalArgumentException e) {
            log.warn("Unknown rule type: {}", condition.getType());
            return ValidationResult.pass();
        }

        // Handle optional conditions - if value is empty and rule is optional, pass
        if (condition.isOptional() && isBlank(strValue)) {
            return ValidationResult.pass();
        }

        return switch (ruleType) {
            // Presence rules
            case REQUIRED -> validateRequired(strValue, condition);
            case OPTIONAL -> ValidationResult.pass();

            // Length rules
            case MIN_LENGTH -> validateMinLength(strValue, condition);
            case MAX_LENGTH -> validateMaxLength(strValue, condition);
            case EXACT_LENGTH -> validateExactLength(strValue, condition);

            // Pattern rules
            case ALPHANUMERIC -> validatePattern(strValue, ALPHANUMERIC_PATTERN, condition,
                    "Doit contenir uniquement des lettres et chiffres");
            case ALPHA_ONLY -> validatePattern(strValue, ALPHA_ONLY_PATTERN, condition,
                    "Doit contenir uniquement des lettres");
            case NUMERIC_ONLY -> validatePattern(strValue, NUMERIC_ONLY_PATTERN, condition,
                    "Doit contenir uniquement des chiffres");
            case UPPERCASE -> validatePattern(strValue, UPPERCASE_PATTERN, condition,
                    "Doit etre en majuscules");
            case EMAIL -> validatePattern(strValue, EMAIL_PATTERN, condition,
                    "Format email invalide");
            case PHONE -> validatePattern(strValue, PHONE_PATTERN, condition,
                    "Format telephone invalide");

            // Forbidden values rules
            case FORBIDDEN_PATTERNS -> validateForbiddenPatterns(strValue, condition);
            case FORBIDDEN_VALUES -> validateForbiddenValues(strValue, condition);
            case NOT_PLACEHOLDER -> validateNotPlaceholder(strValue, condition);

            // Date rules
            case DATE_NOT_FUTURE -> validateDateNotFuture(value, condition);
            case DATE_AFTER -> validateDateAfter(value, condition);
            case DATE_BEFORE -> validateDateBefore(value, condition);
            case DATE_RANGE -> validateDateRange(value, condition);
            case DATE_NOT_EXPIRED -> validateDateNotExpired(value, condition);

            // Prefix/Suffix rules
            case STARTS_WITH -> validateStartsWith(strValue, condition);
            case ENDS_WITH -> validateEndsWith(strValue, condition);
            case CONTAINS -> validateContains(strValue, condition);

            // List rules
            case IN_LIST -> validateInList(strValue, condition);
            case NOT_IN_LIST -> validateNotInList(strValue, condition);

            // Numeric rules
            case MIN_VALUE -> validateMinValue(strValue, condition);
            case MAX_VALUE -> validateMaxValue(strValue, condition);
            case VALUE_RANGE -> validateValueRange(strValue, condition);

            // Custom regex
            case CUSTOM_REGEX -> validateCustomRegex(strValue, condition);
        };
    }

    /**
     * Validate a field value against all conditions in a list.
     * Returns first failure or pass if all conditions pass.
     */
    public ValidationResult validateAll(Object value, List<RuleCondition> conditions) {
        for (RuleCondition condition : conditions) {
            ValidationResult result = validate(value, condition);
            if (!result.isValid()) {
                return result;
            }
        }
        return ValidationResult.pass();
    }

    // ===== PRESENCE VALIDATIONS =====

    private ValidationResult validateRequired(String value, RuleCondition condition) {
        if (isBlank(value)) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() : "Ce champ est obligatoire"
            );
        }
        return ValidationResult.pass();
    }

    // ===== LENGTH VALIDATIONS =====

    private ValidationResult validateMinLength(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        Integer minLen = condition.getIntValue();
        if (minLen == null) return ValidationResult.pass();

        if (value.length() < minLen) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit contenir au moins %d caracteres", minLen)
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateMaxLength(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        Integer maxLen = condition.getIntValue();
        if (maxLen == null) return ValidationResult.pass();

        if (value.length() > maxLen) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit contenir au maximum %d caracteres", maxLen)
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateExactLength(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        Integer exactLen = condition.getIntValue();
        if (exactLen == null) return ValidationResult.pass();

        if (value.length() != exactLen) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit contenir exactement %d caracteres", exactLen)
            );
        }
        return ValidationResult.pass();
    }

    // ===== PATTERN VALIDATIONS =====

    private ValidationResult validatePattern(String value, Pattern pattern, RuleCondition condition, String defaultMessage) {
        if (isBlank(value)) return ValidationResult.pass();

        if (!pattern.matcher(value).matches()) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() : defaultMessage
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateCustomRegex(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        String pattern = condition.getStringValue();
        if (pattern == null) return ValidationResult.pass();

        try {
            if (!Pattern.matches(pattern, value)) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() : "Format invalide"
                );
            }
        } catch (Exception e) {
            log.warn("Invalid regex pattern: {}", pattern);
        }
        return ValidationResult.pass();
    }

    // ===== FORBIDDEN VALUES VALIDATIONS =====

    private ValidationResult validateForbiddenPatterns(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        List<String> patterns = condition.getValues();
        if (patterns == null || patterns.isEmpty()) return ValidationResult.pass();

        String upperValue = value.toUpperCase();
        for (String pattern : patterns) {
            if (upperValue.contains(pattern.toUpperCase())) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("Ne peut pas contenir '%s'", pattern)
                );
            }
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateForbiddenValues(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        List<String> forbiddenValues = condition.getValues();
        if (forbiddenValues == null || forbiddenValues.isEmpty()) return ValidationResult.pass();

        for (String forbidden : forbiddenValues) {
            if (value.equalsIgnoreCase(forbidden)) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La valeur '%s' n'est pas autorisee", forbidden)
                );
            }
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateNotPlaceholder(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        if (PLACEHOLDER_PATTERN.matcher(value).matches()) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            "Ne peut pas etre compose uniquement de X"
            );
        }
        return ValidationResult.pass();
    }

    // ===== DATE VALIDATIONS =====

    private ValidationResult validateDateNotFuture(Object value, RuleCondition condition) {
        LocalDate date = toLocalDate(value);
        if (date == null) return ValidationResult.pass();

        if (date.isAfter(LocalDate.now())) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            "La date ne peut pas etre dans le futur"
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateDateAfter(Object value, RuleCondition condition) {
        LocalDate date = toLocalDate(value);
        if (date == null) return ValidationResult.pass();

        String minDateStr = condition.getStringValue();
        if (minDateStr == null) return ValidationResult.pass();

        try {
            LocalDate minDate = LocalDate.parse(minDateStr);
            if (date.isBefore(minDate)) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La date doit etre apres le %s", minDateStr)
                );
            }
        } catch (DateTimeParseException e) {
            log.warn("Invalid date format in rule: {}", minDateStr);
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateDateBefore(Object value, RuleCondition condition) {
        LocalDate date = toLocalDate(value);
        if (date == null) return ValidationResult.pass();

        String maxDateStr = condition.getStringValue();
        if (maxDateStr == null) return ValidationResult.pass();

        try {
            LocalDate maxDate = LocalDate.parse(maxDateStr);
            if (date.isAfter(maxDate)) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La date doit etre avant le %s", maxDateStr)
                );
            }
        } catch (DateTimeParseException e) {
            log.warn("Invalid date format in rule: {}", maxDateStr);
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateDateRange(Object value, RuleCondition condition) {
        LocalDate date = toLocalDate(value);
        if (date == null) return ValidationResult.pass();

        String minDateStr = condition.getMinString();
        String maxDateStr = condition.getMaxString();

        try {
            if (minDateStr != null) {
                LocalDate minDate = LocalDate.parse(minDateStr);
                if (date.isBefore(minDate)) {
                    return ValidationResult.fail(
                            condition.getMessage() != null ? condition.getMessage() :
                                    String.format("La date doit etre apres le %s", minDateStr)
                    );
                }
            }
            if (maxDateStr != null) {
                LocalDate maxDate = LocalDate.parse(maxDateStr);
                if (date.isAfter(maxDate)) {
                    return ValidationResult.fail(
                            condition.getMessage() != null ? condition.getMessage() :
                                    String.format("La date doit etre avant le %s", maxDateStr)
                    );
                }
            }
        } catch (DateTimeParseException e) {
            log.warn("Invalid date format in rule: min={}, max={}", minDateStr, maxDateStr);
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateDateNotExpired(Object value, RuleCondition condition) {
        LocalDate date = toLocalDate(value);
        if (date == null) return ValidationResult.pass(); // No date = no expiry

        if (date.isBefore(LocalDate.now())) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            "La date est expiree"
            );
        }
        return ValidationResult.pass();
    }

    // ===== PREFIX/SUFFIX VALIDATIONS =====

    private ValidationResult validateStartsWith(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        String prefix = condition.getStringValue();
        if (prefix == null) return ValidationResult.pass();

        if (!value.toUpperCase().startsWith(prefix.toUpperCase())) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit commencer par '%s'", prefix)
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateEndsWith(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        String suffix = condition.getStringValue();
        if (suffix == null) return ValidationResult.pass();

        if (!value.toUpperCase().endsWith(suffix.toUpperCase())) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit se terminer par '%s'", suffix)
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateContains(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        String substring = condition.getStringValue();
        if (substring == null) return ValidationResult.pass();

        if (!value.toUpperCase().contains(substring.toUpperCase())) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit contenir '%s'", substring)
            );
        }
        return ValidationResult.pass();
    }

    // ===== LIST VALIDATIONS =====

    private ValidationResult validateInList(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        List<String> allowedValues = condition.getValues();
        if (allowedValues == null || allowedValues.isEmpty()) return ValidationResult.pass();

        boolean found = allowedValues.stream()
                .anyMatch(allowed -> allowed.equalsIgnoreCase(value));

        if (!found) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            String.format("Doit etre l'une des valeurs: %s", String.join(", ", allowedValues))
            );
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateNotInList(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        List<String> forbiddenValues = condition.getValues();
        if (forbiddenValues == null || forbiddenValues.isEmpty()) return ValidationResult.pass();

        boolean found = forbiddenValues.stream()
                .anyMatch(forbidden -> forbidden.equalsIgnoreCase(value));

        if (found) {
            return ValidationResult.fail(
                    condition.getMessage() != null ? condition.getMessage() :
                            "Cette valeur n'est pas autorisee"
            );
        }
        return ValidationResult.pass();
    }

    // ===== NUMERIC VALIDATIONS =====

    private ValidationResult validateMinValue(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        try {
            double numValue = Double.parseDouble(value);
            Double minValue = condition.getIntValue() != null ? condition.getIntValue().doubleValue() : null;

            if (minValue != null && numValue < minValue) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La valeur doit etre >= %s", minValue)
                );
            }
        } catch (NumberFormatException e) {
            // Not a number, skip validation
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateMaxValue(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        try {
            double numValue = Double.parseDouble(value);
            Double maxValue = condition.getIntValue() != null ? condition.getIntValue().doubleValue() : null;

            if (maxValue != null && numValue > maxValue) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La valeur doit etre <= %s", maxValue)
                );
            }
        } catch (NumberFormatException e) {
            // Not a number, skip validation
        }
        return ValidationResult.pass();
    }

    private ValidationResult validateValueRange(String value, RuleCondition condition) {
        if (isBlank(value)) return ValidationResult.pass();

        try {
            double numValue = Double.parseDouble(value);
            Integer minValue = condition.getMinInt();
            Integer maxValue = condition.getMaxInt();

            if (minValue != null && numValue < minValue) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La valeur doit etre entre %s et %s", minValue, maxValue)
                );
            }
            if (maxValue != null && numValue > maxValue) {
                return ValidationResult.fail(
                        condition.getMessage() != null ? condition.getMessage() :
                                String.format("La valeur doit etre entre %s et %s", minValue, maxValue)
                );
            }
        } catch (NumberFormatException e) {
            // Not a number, skip validation
        }
        return ValidationResult.pass();
    }

    // ===== HELPER METHODS =====

    private String normalizeString(Object value) {
        if (value == null) return null;
        String str = value.toString().trim();
        return str.isEmpty() ? null : str;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate localDate) return localDate;
        if (value instanceof java.sql.Date sqlDate) return sqlDate.toLocalDate();
        if (value instanceof java.util.Date utilDate) {
            return new java.sql.Date(utilDate.getTime()).toLocalDate();
        }
        // Try parsing string
        try {
            return LocalDate.parse(value.toString());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    // ===== RESULT CLASS =====

    /**
     * Result of a validation check.
     */
    public record ValidationResult(boolean isValid, String message) {
        public static ValidationResult pass() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult fail(String message) {
            return new ValidationResult(false, message);
        }
    }
}
