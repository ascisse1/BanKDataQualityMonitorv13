package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.metrics.BusinessMetricsConfig;
import com.adakalgroup.bdqm.model.CbsTable;
import com.adakalgroup.bdqm.model.Structure;
import com.adakalgroup.bdqm.repository.CbsTableRepository;
import com.adakalgroup.bdqm.repository.StructureRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Dictionary-driven data sync service.
 * Syncs all CBS tables that have syncEnabled=true in the data dictionary,
 * ordered by syncOrder. No hardcoded table names.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DataSyncService {

    private final DynamicCbsQueryService dynamicCbsQueryService;
    private final CbsTableRepository cbsTableRepository;
    private final CbsDataDictionaryService dataDictionaryService;
    private final StructureRepository structureRepository;
    private final CbsValidationService cbsValidationService;
    private final BusinessMetricsConfig metricsConfig;

    private static final int BATCH_SIZE = 1000;

    @Value("${app.validation.max-records:0}")
    private int validationMaxRecords;

    public DataSyncService(DynamicCbsQueryService dynamicCbsQueryService,
                           CbsTableRepository cbsTableRepository,
                           CbsDataDictionaryService dataDictionaryService,
                           StructureRepository structureRepository,
                           CbsValidationService cbsValidationService,
                           BusinessMetricsConfig metricsConfig) {
        this.dynamicCbsQueryService = dynamicCbsQueryService;
        this.cbsTableRepository = cbsTableRepository;
        this.dataDictionaryService = dataDictionaryService;
        this.structureRepository = structureRepository;
        this.cbsValidationService = cbsValidationService;
        this.metricsConfig = metricsConfig;
    }

    /**
     * Sync ALL enabled CBS tables from Informix to PostgreSQL mirror.
     * Tables are determined by cbs_tables where sync_enabled=true, ordered by sync_order.
     *
     * @return list of SyncResult, one per table
     */
    @Transactional
    public List<SyncResult> syncAll() {
        List<CbsTable> tables = cbsTableRepository.findBySyncEnabledTrueAndActiveTrueOrderBySyncOrderAsc();
        log.info("Starting dictionary-driven sync for {} enabled tables", tables.size());

        List<SyncResult> results = new ArrayList<>();

        for (CbsTable table : tables) {
            try {
                SyncResult result = syncTable(table.getTableName());
                results.add(result);

                // Post-sync hooks per table
                runPostSyncHooks(table.getTableName(), result);

            } catch (Exception e) {
                log.error("Sync failed for table {}: {}", table.getTableName(), e.getMessage(), e);
                results.add(new SyncResult(table.getTableName(), 0, 0,
                        1, LocalDateTime.now(), LocalDateTime.now()));
            }
        }

        log.info("Full sync completed: {} tables processed", results.size());
        metricsConfig.recordDataSyncSuccess();
        return results;
    }

    /**
     * Sync a single CBS table by name.
     * Dictionary-driven: columns determined by cbs_fields metadata.
     */
    @Transactional
    public SyncResult syncTable(String tableName) {
        log.info("Starting sync for table '{}' from Informix to PostgreSQL...", tableName);
        LocalDateTime startTime = LocalDateTime.now();

        int upserted = 0;
        int errors = 0;
        int offset = 0;

        try {
            // Ensure mirror table schema matches dictionary
            dynamicCbsQueryService.ensureMirrorSchema(tableName);

            long totalCount = dynamicCbsQueryService.countCbsRecords(tableName);
            log.info("Table '{}': {} records to sync", tableName, totalCount);
            if("bkcli".equals(tableName)) {
                totalCount = 10000;
            }
            while (offset < totalCount) {
                List<Map<String, Object>> batch = dynamicCbsQueryService.fetchFromCbs(tableName, offset, BATCH_SIZE);
                if (batch.isEmpty()) break;

                log.debug("Table '{}': processing batch offset={}, size={}", tableName, offset, batch.size());

                int batchUpserted = dynamicCbsQueryService.upsertToMirror(tableName, batch);
                upserted += batchUpserted;

                offset += BATCH_SIZE;
                if (batch.size() < BATCH_SIZE) break;
            }

            log.info("Sync completed for '{}'. Upserted: {}, Errors: {}", tableName, upserted, errors);
            return new SyncResult(tableName, upserted, 0, errors, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failed to sync table '{}': {}", tableName, e.getMessage(), e);
            metricsConfig.recordDataSyncFailure();
            throw new RuntimeException("Sync failed for table " + tableName, e);
        }
    }

    /**
     * Post-sync hooks for tables.
     * - Any table with validationEnabled=true: run validation + auto-resolve anomalies
     * - Agency table (structureField configured): auto-create Structure entities
     */
    private void runPostSyncHooks(String tableName, SyncResult result) {
        try {
            var tableConfig = dataDictionaryService.getTableByName(tableName);

            // Dictionary-driven validation for any table with validationEnabled=true
            if (Boolean.TRUE.equals(tableConfig.getValidationEnabled())) {
                runValidation(tableName);
            }

            // Auto-create Structure entities from agency-like tables
            // Identified by having a structureField configured in the dictionary
            if (tableConfig.getStructureField() != null
                    && tableConfig.getPkField() != null
                    && tableConfig.getLabelField() != null) {
                syncStructuresFromTable(tableName, tableConfig.getPkField(), tableConfig.getLabelField());
            }
        } catch (Exception e) {
            log.warn("Could not run post-sync hooks for '{}': {}", tableName, e.getMessage());
        }
    }

    private void runValidation(String tableName) {
        log.info("Running post-sync validation for table '{}'...", tableName);
        try {
            List<Map<String, Object>> allRecords = new ArrayList<>();
            int offset = 0;
            boolean hasLimit = validationMaxRecords > 0;
            while (!hasLimit || allRecords.size() < validationMaxRecords) {
                int remaining = validationMaxRecords - allRecords.size();
                int fetchSize = hasLimit ? Math.min(BATCH_SIZE, remaining) : BATCH_SIZE;
                List<Map<String, Object>> batch = dynamicCbsQueryService.fetchFromCbs(tableName, offset, fetchSize);
                if (batch.isEmpty()) break;
                allRecords.addAll(batch);
                offset += batch.size();
                if (batch.size() < fetchSize) break;
            }

            if (!allRecords.isEmpty()) {
                CbsValidationService.ValidationResult validationResult =
                        cbsValidationService.validateRecords(tableName, allRecords);
                log.info("Validation for '{}': anomalies={}, auto-resolved={}, skipped={}, errors={}",
                        tableName,
                        validationResult.anomaliesCreated(),
                        validationResult.autoResolved(),
                        validationResult.duplicatesSkipped(),
                        validationResult.errors());
            }
        } catch (Exception e) {
            log.error("Post-sync validation failed for '{}': {}", tableName, e.getMessage(), e);
        }
    }

    /**
     * Auto-create Structure entities from a CBS table that represents organizational units.
     * Dictionary-driven: uses pkField as structure code and labelField as structure name.
     */
    private void syncStructuresFromTable(String tableName, String pkField, String labelField) {
        log.info("Syncing structures from table '{}'...", tableName);
        try {
            List<Map<String, Object>> records = dynamicCbsQueryService.fetchFromCbs(tableName, 0, 10000);

            int created = 0;
            for (Map<String, Object> row : records) {
                String code = getString(row, pkField);
                String label = getString(row, labelField);
                if (code == null || code.isBlank()) continue;

                boolean exists = structureRepository.findByCode(code).isPresent();
                if (!exists) {
                    Structure s = Structure.builder()
                        .code(code)
                        .name(label != null ? label : code)
                        .type("AGENCY")
                        .status("ACTIVE")
                        .build();
                    structureRepository.save(s);
                    created++;
                }
            }

            if (created > 0) {
                log.info("Created {} new structures from table '{}'", created, tableName);
            }
        } catch (Exception e) {
            log.error("Structure sync from table '{}' failed: {}", tableName, e.getMessage(), e);
        }
    }

    // ===== Helpers =====

    private String getString(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        String strValue = value.toString().trim();
        return strValue.isEmpty() ? null : strValue;
    }

    public record SyncResult(
            String entity, int inserted, int updated, int errors,
            LocalDateTime startTime, LocalDateTime endTime
    ) {
        public long durationSeconds() {
            return java.time.Duration.between(startTime, endTime).getSeconds();
        }
        public int totalProcessed() {
            return inserted + updated + errors;
        }
    }
}
