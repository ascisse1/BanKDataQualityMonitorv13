package com.bsic.dataqualitybackend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

/**
 * Central registry of allowed CBS (Informix bkcli) column names.
 * Now backed by the CBS Data Dictionary (cbs_fields table).
 * Falls back to a static map if the data dictionary is not yet populated.
 *
 * Used to:
 * 1. Whitelist columns before dynamic SQL (prevents injection)
 * 2. Map CBS columns to the aliases returned by InformixRepository.getClientById()
 *    so that reconciliation can compare expected vs actual values.
 */
@Component
@Slf4j
public class CbsColumnRegistry {

    private final CbsDataDictionaryService dataDictionaryService;

    private volatile Set<String> allowedColumns;
    private volatile Map<String, String> cbsToAlias;

    /**
     * Static fallback for backward compatibility during migration.
     */
    private static final Map<String, String> FALLBACK_CBS_TO_ALIAS = Map.ofEntries(
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
            Map.entry("age", "age"),
            Map.entry("res", "residence_country"),
            Map.entry("dat_fat", "fatca_date")
    );

    public CbsColumnRegistry(CbsDataDictionaryService dataDictionaryService) {
        this.dataDictionaryService = dataDictionaryService;
    }

    @PostConstruct
    public void refresh() {
        try {
            Set<String> dbColumns = dataDictionaryService.getUpdatableColumns("bkcli");
            Map<String, String> dbAliases = dataDictionaryService.getColumnAliasMap("bkcli");

            if (!dbColumns.isEmpty()) {
                this.allowedColumns = dbColumns;
                this.cbsToAlias = dbAliases;
                log.info("CbsColumnRegistry loaded from data dictionary: {} columns", allowedColumns.size());
            } else {
                useFallback();
            }
        } catch (Exception e) {
            log.warn("Failed to load CbsColumnRegistry from data dictionary, using fallback: {}", e.getMessage());
            useFallback();
        }
    }

    private void useFallback() {
        this.cbsToAlias = FALLBACK_CBS_TO_ALIAS;
        this.allowedColumns = FALLBACK_CBS_TO_ALIAS.keySet();
        log.info("CbsColumnRegistry using static fallback: {} columns", allowedColumns.size());
    }

    @EventListener(DataDictionaryChangedEvent.class)
    public void onDictionaryChanged() {
        log.info("Data dictionary changed, refreshing CbsColumnRegistry...");
        refresh();
    }

    /**
     * Returns true if the given field name is a valid CBS column.
     */
    public boolean isAllowedColumn(String fieldName) {
        return fieldName != null && allowedColumns.contains(fieldName.toLowerCase());
    }

    /**
     * Maps a CBS column name to the alias returned by InformixRepository.getClientById().
     */
    public String toAlias(String cbsColumn) {
        if (cbsColumn == null) return null;
        return cbsToAlias.getOrDefault(cbsColumn.toLowerCase(), cbsColumn);
    }

    /**
     * Returns the set of allowed CBS column names.
     */
    public Set<String> getAllowedColumns() {
        return Collections.unmodifiableSet(allowedColumns);
    }
}
