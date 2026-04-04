package com.adakalgroup.dataqualitybackend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

/**
 * Central registry of allowed CBS column names.
 * Backed by the CBS Data Dictionary (cbs_fields table).
 *
 * Used to:
 * 1. Whitelist columns before dynamic SQL (prevents injection)
 * 2. Map CBS columns to query aliases for reconciliation.
 */
@Component
@Slf4j
public class CbsColumnRegistry {

    private final CbsDataDictionaryService dataDictionaryService;

    private volatile Set<String> allowedColumns = Collections.emptySet();
    private volatile Map<String, String> cbsToAlias = Collections.emptyMap();

    public CbsColumnRegistry(CbsDataDictionaryService dataDictionaryService) {
        this.dataDictionaryService = dataDictionaryService;
    }

    @PostConstruct
    public void refresh() {
        try {
            Set<String> dbColumns = dataDictionaryService.getUpdatableColumns("bkcli");
            Map<String, String> dbAliases = dataDictionaryService.getColumnAliasMap("bkcli");

            if (dbColumns.isEmpty()) {
                log.warn("CbsColumnRegistry: data dictionary returned 0 columns for bkcli. "
                        + "Ensure cbs_tables/cbs_fields seed data is loaded.");
            }

            this.allowedColumns = dbColumns;
            this.cbsToAlias = dbAliases;
            log.info("CbsColumnRegistry loaded from data dictionary: {} columns", allowedColumns.size());
        } catch (Exception e) {
            log.error("Failed to load CbsColumnRegistry from data dictionary: {}", e.getMessage());
            throw new IllegalStateException(
                    "CbsColumnRegistry requires a populated data dictionary (cbs_tables + cbs_fields). "
                    + "Check that Liquibase seed data has been applied.", e);
        }
    }

    @EventListener(DataDictionaryChangedEvent.class)
    public void onDictionaryChanged() {
        log.info("Data dictionary changed, refreshing CbsColumnRegistry...");
        try {
            Set<String> dbColumns = dataDictionaryService.getUpdatableColumns("bkcli");
            Map<String, String> dbAliases = dataDictionaryService.getColumnAliasMap("bkcli");
            this.allowedColumns = dbColumns;
            this.cbsToAlias = dbAliases;
            log.info("CbsColumnRegistry refreshed: {} columns", allowedColumns.size());
        } catch (Exception e) {
            log.warn("Failed to refresh CbsColumnRegistry: {}", e.getMessage());
        }
    }

    /**
     * Returns true if the given field name is a valid CBS column.
     */
    public boolean isAllowedColumn(String fieldName) {
        return fieldName != null && allowedColumns.contains(fieldName.toLowerCase());
    }

    /**
     * Maps a CBS column name to the query alias from dictionary metadata.
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
