package com.adakalgroup.dataqualitybackend.model.enums;

/**
 * Natural language rule types for user-friendly validation definitions.
 * Each type represents a single, atomic validation check.
 */
public enum NaturalRuleType {

    // ===== PRESENCE RULES =====
    /** Field must not be null or empty */
    REQUIRED("required", "Champ obligatoire"),

    /** Field can be null, but if present must pass other rules */
    OPTIONAL("optional", "Champ optionnel"),

    // ===== TEXT LENGTH RULES =====
    /** Minimum number of characters */
    MIN_LENGTH("minLength", "Longueur minimale"),

    /** Maximum number of characters */
    MAX_LENGTH("maxLength", "Longueur maximale"),

    /** Exact number of characters */
    EXACT_LENGTH("exactLength", "Longueur exacte"),

    // ===== TEXT PATTERN RULES (predefined) =====
    /** Only letters and numbers [A-Za-z0-9] */
    ALPHANUMERIC("alphanumeric", "Alphanumerique"),

    /** Only letters [A-Za-z] */
    ALPHA_ONLY("alphaOnly", "Lettres uniquement"),

    /** Only numbers [0-9] */
    NUMERIC_ONLY("numericOnly", "Chiffres uniquement"),

    /** Uppercase letters only [A-Z] */
    UPPERCASE("uppercase", "Majuscules uniquement"),

    /** Email format */
    EMAIL("email", "Format email"),

    /** Phone number format */
    PHONE("phone", "Format telephone"),

    // ===== FORBIDDEN VALUES RULES =====
    /** Value must not contain specified patterns */
    FORBIDDEN_PATTERNS("forbiddenPatterns", "Motifs interdits"),

    /** Value must not equal specified values */
    FORBIDDEN_VALUES("forbiddenValues", "Valeurs interdites"),

    /** Value must not be only X characters (placeholder data) */
    NOT_PLACEHOLDER("notPlaceholder", "Pas de donnees fictives"),

    // ===== DATE RULES =====
    /** Date must not be in the future */
    DATE_NOT_FUTURE("dateNotFuture", "Date non future"),

    /** Date must be after specified date */
    DATE_AFTER("dateAfter", "Date apres"),

    /** Date must be before specified date */
    DATE_BEFORE("dateBefore", "Date avant"),

    /** Date must be within a valid range */
    DATE_RANGE("dateRange", "Plage de dates"),

    /** Date must not be expired (>= today) */
    DATE_NOT_EXPIRED("dateNotExpired", "Date non expiree"),

    // ===== PREFIX/SUFFIX RULES =====
    /** Value must start with specified prefix */
    STARTS_WITH("startsWith", "Commence par"),

    /** Value must end with specified suffix */
    ENDS_WITH("endsWith", "Se termine par"),

    /** Value must contain specified substring */
    CONTAINS("contains", "Contient"),

    // ===== LIST RULES =====
    /** Value must be one of the specified values */
    IN_LIST("inList", "Dans la liste"),

    /** Value must not be one of the specified values */
    NOT_IN_LIST("notInList", "Hors de la liste"),

    // ===== NUMERIC RULES =====
    /** Numeric value must be >= minimum */
    MIN_VALUE("minValue", "Valeur minimale"),

    /** Numeric value must be <= maximum */
    MAX_VALUE("maxValue", "Valeur maximale"),

    /** Numeric value must be in range [min, max] */
    VALUE_RANGE("valueRange", "Plage de valeurs"),

    // ===== CUSTOM RULES =====
    /** Custom regex pattern (for edge cases) */
    CUSTOM_REGEX("customRegex", "Expression reguliere");

    private final String code;
    private final String label;

    NaturalRuleType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Find rule type by its code (case-insensitive).
     */
    public static NaturalRuleType fromCode(String code) {
        if (code == null) return null;
        for (NaturalRuleType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown rule type code: " + code);
    }
}
