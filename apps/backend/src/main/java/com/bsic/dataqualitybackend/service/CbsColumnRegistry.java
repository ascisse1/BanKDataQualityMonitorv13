package com.bsic.dataqualitybackend.service;

import java.util.Map;
import java.util.Set;

/**
 * Central registry of allowed CBS (Informix bkcli) column names.
 * Used to:
 * 1. Whitelist columns before dynamic SQL (prevents injection)
 * 2. Map CBS columns to the aliases returned by InformixRepository.getClientById()
 *    so that reconciliation can compare expected vs actual values.
 */
public final class CbsColumnRegistry {

    private CbsColumnRegistry() {}

    /**
     * Allowed CBS columns that can be updated via CbsUpdateService.
     * Keys = CBS column names (used in fieldName throughout the app).
     * Values = aliases returned by InformixRepository.getClientById().
     */
    private static final Map<String, String> CBS_TO_ALIAS = Map.ofEntries(
            Map.entry("nom", "name"),
            Map.entry("pre", "firstname"),
            Map.entry("adr", "address"),
            Map.entry("vil", "city"),
            Map.entry("cpo", "postal_code"),
            Map.entry("tel", "phone"),
            Map.entry("ema", "email"),
            Map.entry("dna", "birth_date"),
            Map.entry("nat", "nationality"),
            Map.entry("tcli", "client_type"),
            Map.entry("sta_fat", "fatca_status"),
            Map.entry("sext", "sext"),
            Map.entry("viln", "viln"),
            Map.entry("payn", "payn"),
            Map.entry("tid", "tid"),
            Map.entry("nid", "nid"),
            Map.entry("vid", "vid"),
            Map.entry("nrc", "nrc"),
            Map.entry("rso", "rso"),
            Map.entry("fju", "fju"),
            Map.entry("datc", "datc"),
            Map.entry("nmer", "nmer"),
            Map.entry("sig", "sig"),
            Map.entry("sec", "sec"),
            Map.entry("catn", "catn"),
            Map.entry("lienbq", "lienbq"),
            Map.entry("age", "age")
    );

    /**
     * Set of CBS column names that are allowed in UPDATE statements.
     */
    public static final Set<String> ALLOWED_COLUMNS = CBS_TO_ALIAS.keySet();

    /**
     * Returns true if the given field name is a valid CBS column.
     */
    public static boolean isAllowedColumn(String fieldName) {
        return fieldName != null && ALLOWED_COLUMNS.contains(fieldName.toLowerCase());
    }

    /**
     * Maps a CBS column name to the alias returned by InformixRepository.getClientById().
     * Used by ReconciliationService to look up values in the CBS result map.
     *
     * @return the alias, or the fieldName itself if no alias is defined
     */
    public static String toAlias(String cbsColumn) {
        if (cbsColumn == null) return null;
        return CBS_TO_ALIAS.getOrDefault(cbsColumn.toLowerCase(), cbsColumn);
    }
}
