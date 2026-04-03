package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.config.metrics.BusinessMetricsConfig;
import com.bsic.dataqualitybackend.model.CbsTable;
import com.bsic.dataqualitybackend.model.Structure;
import com.bsic.dataqualitybackend.repository.CbsTableRepository;
import com.bsic.dataqualitybackend.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DataSyncService {

    private final DynamicCbsQueryService dynamicCbsQueryService;
    private final CbsTableRepository cbsTableRepository;
    private final CbsDataDictionaryService dataDictionaryService;
    private final StructureRepository structureRepository;
    private final CbsValidationService cbsValidationService;
    private final BusinessMetricsConfig metricsConfig;

    private static final int BATCH_SIZE = 1000;

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
     * Post-sync hooks for specific tables.
     * - bkcli: run validation + auto-resolve anomalies
     * - bkage: auto-create Structure entities
     */
    private void runPostSyncHooks(String tableName, SyncResult result) {
        // Dictionary-driven validation for any table with validationEnabled=true
        try {
            var tableConfig = dataDictionaryService.getTableByName(tableName);
            if (Boolean.TRUE.equals(tableConfig.getValidationEnabled())) {
                runValidation(tableName);
            }
        } catch (Exception e) {
            log.warn("Could not check validation config for '{}': {}", tableName, e.getMessage());
        }

        // bkage-specific: auto-create Structure entities
        if ("bkage".equals(tableName)) {
            syncStructuresFromAgencies();
        }
    }

    private void runValidation(String tableName) {
        log.info("Running post-sync validation for table '{}'...", tableName);
        try {
            List<Map<String, Object>> allRecords = new ArrayList<>();
            int offset = 0;
            while (true) {
                List<Map<String, Object>> batch = dynamicCbsQueryService.fetchFromCbs(tableName, offset, BATCH_SIZE);
                if (batch.isEmpty()) break;
                allRecords.addAll(batch);
                offset += BATCH_SIZE;
                if (batch.size() < BATCH_SIZE) break;
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
     * Auto-create Structure entities for agencies that don't have one.
     * Links cbs.bkage to public.structure by convention: structure.code = bkage.age
     */
    private void syncStructuresFromAgencies() {
        log.info("Syncing structures from agencies...");
        try {
            List<Map<String, Object>> agencies = dynamicCbsQueryService.fetchFromCbs("bkage", 0, 10000);

            int created = 0;
            for (Map<String, Object> row : agencies) {
                String age = getString(row, "age");
                String lib = getString(row, "lib");
                if (age == null || age.isBlank()) continue;

                boolean exists = structureRepository.findByCode(age).isPresent();
                if (!exists) {
                    Structure s = Structure.builder()
                        .code(age)
                        .name(lib != null ? lib : age)
                        .type("AGENCY")
                        .status("ACTIVE")
                        .build();
                    structureRepository.save(s);
                    created++;
                }
            }

            if (created > 0) {
                log.info("Created {} new structures from agencies", created);
            }
        } catch (Exception e) {
            log.error("Structure sync from agencies failed: {}", e.getMessage(), e);
        }
    }

    // ===== Legacy methods (kept for backward compatibility with scheduler/controller) =====

    /** @deprecated Use {@link #syncAll()} or {@link #syncTable(String)} instead */
    @Deprecated
    @Transactional
    public SyncResult syncClients() {
        return syncTable("bkcli");
    }

    /** @deprecated Use {@link #syncAll()} or {@link #syncTable(String)} instead */
    @Deprecated
    @Transactional
    public SyncResult syncAgencies() {
        return syncTable("bkage");
    }

    /** @deprecated Use {@link #syncAll()} instead */
    @Deprecated
    @Transactional
    public SyncResult syncClientsBatch() {
        return syncTable("bkcli");
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
