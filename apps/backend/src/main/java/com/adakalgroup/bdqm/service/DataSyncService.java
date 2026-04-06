package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.metrics.BusinessMetricsConfig;
import com.adakalgroup.bdqm.model.CbsTable;

import com.adakalgroup.bdqm.repository.CbsTableRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
    private final CbsValidationService cbsValidationService;
    private final BusinessMetricsConfig metricsConfig;
    private final TransactionTemplate transactionTemplate;
    private final SyncProgressService syncProgressService;

    private static final int BATCH_SIZE = 1000;

    @Value("${app.max-records:0}")
    private int maxRecords;

    @Value("${app.sync.parallelism:1}")
    private int parallelism;

    @Value("${app.sync.batch-retry:2}")
    private int batchRetry;

    public DataSyncService(DynamicCbsQueryService dynamicCbsQueryService,
                           CbsTableRepository cbsTableRepository,
                           CbsDataDictionaryService dataDictionaryService,
                           CbsValidationService cbsValidationService,
                           BusinessMetricsConfig metricsConfig,
                           TransactionTemplate transactionTemplate,
                           SyncProgressService syncProgressService) {
        this.dynamicCbsQueryService = dynamicCbsQueryService;
        this.cbsTableRepository = cbsTableRepository;
        this.dataDictionaryService = dataDictionaryService;
        this.cbsValidationService = cbsValidationService;
        this.metricsConfig = metricsConfig;
        this.transactionTemplate = transactionTemplate;
        this.syncProgressService = syncProgressService;
    }

    /**
     * Sync ALL enabled CBS tables from Informix to PostgreSQL mirror.
     * Tables are determined by cbs_tables where sync_enabled=true, ordered by sync_order.
     *
     * @return list of SyncResult, one per table
     */
    public List<SyncResult> syncAll() {
        List<CbsTable> tables = cbsTableRepository.findBySyncEnabledTrueAndActiveTrueOrderBySyncOrderAsc();
        log.info("Starting dictionary-driven sync for {} enabled tables (parallelism={})", tables.size(), parallelism);

        long syncStart = System.currentTimeMillis();
        List<SyncResult> results;
        if (parallelism <= 1) {
            results = syncAllSequential(tables);
        } else {
            results = syncAllParallel(tables);
        }

        long totalDuration = System.currentTimeMillis() - syncStart;
        syncProgressService.emitSyncComplete(results.size(), totalDuration);
        metricsConfig.recordDataSyncSuccess();
        return results;
    }

    private List<SyncResult> syncAllSequential(List<CbsTable> tables) {
        List<SyncResult> results = new ArrayList<>();
        for (CbsTable table : tables) {
            results.add(syncTableSafe(table.getTableName()));
        }
        log.info("Full sync completed: {} tables processed (sequential)", results.size());
        return results;
    }

    private List<SyncResult> syncAllParallel(List<CbsTable> tables) {
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(parallelism, tables.size()));
        try {
            List<CompletableFuture<SyncResult>> futures = tables.stream()
                    .map(table -> CompletableFuture.supplyAsync(
                            () -> syncTableSafe(table.getTableName()), executor))
                    .toList();

            List<SyncResult> results = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            log.info("Full sync completed: {} tables processed (parallel, threads={})", results.size(), parallelism);
            return results;
        } finally {
            executor.shutdown();
        }
    }

    private SyncResult syncTableSafe(String tableName) {
        try {
            return syncTable(tableName);
        } catch (Exception e) {
            log.error("Sync failed for table {}: {}", tableName, e.getMessage(), e);
            return new SyncResult(tableName, 0, 0, 0, 0, LocalDateTime.now(), LocalDateTime.now());
        }
    }

    /**
     * Sync a single CBS table: fetch batch → upsert mirror → validate batch → next.
     * Each batch runs in its own transaction — failure is isolated, no full rollback.
     */
    public SyncResult syncTable(String tableName) {
        log.info("Starting sync for table '{}' from Informix to PostgreSQL...", tableName);
        LocalDateTime startTime = LocalDateTime.now();

        int upserted = 0;
        int validated = 0;
        int anomaliesCreated = 0;
        int errors = 0;
        int offset = 0;

        try {
            dynamicCbsQueryService.ensureMirrorSchema(tableName);

            var tableConfig = dataDictionaryService.getTableByName(tableName);
            boolean validationEnabled = Boolean.TRUE.equals(tableConfig.getValidationEnabled());
            log.info("Table '{}': validationEnabled={}", tableName, validationEnabled);

            // CDC
            CbsTable tableEntity = cbsTableRepository.findByTableName(tableName).orElse(null);
            String cdcField = tableEntity != null ? tableEntity.getCdcField() : null;
            LocalDateTime lastSyncAt = tableEntity != null ? tableEntity.getLastSyncAt() : null;

            boolean cdcMode = cdcField != null && lastSyncAt != null;
            if (cdcMode) {
                log.info("Table '{}': CDC mode (field={}, since={})", tableName, cdcField, lastSyncAt);
            } else if (cdcField != null) {
                log.info("Table '{}': CDC field '{}' configured but no lastSyncAt, full sync", tableName, cdcField);
            }

            long totalCount = cdcMode
                    ? dynamicCbsQueryService.countCbsRecordsSince(tableName, cdcField, lastSyncAt)
                    : dynamicCbsQueryService.countCbsRecords(tableName);
            if (maxRecords > 0) {
                totalCount = Math.min(totalCount, maxRecords);
            }
            log.info("Table '{}': {} records to process", tableName, totalCount);

            // Streaming: each batch in its own transaction
            final boolean isCdc = cdcMode;
            while (offset < totalCount) {
                long batchStart = System.currentTimeMillis();

                List<Map<String, Object>> batch = cdcMode
                        ? dynamicCbsQueryService.fetchFromCbsSince(tableName, cdcField, lastSyncAt, offset, BATCH_SIZE)
                        : dynamicCbsQueryService.fetchFromCbs(tableName, offset, BATCH_SIZE);
                if (batch.isEmpty()) break;

                log.info("Table '{}': batch offset={}, size={}", tableName, offset, batch.size());

                // Transaction per batch: upsert + validate in one atomic unit
                final List<Map<String, Object>> batchRef = batch;
                final boolean doValidate = validationEnabled;
                BatchResult br = transactionTemplate.execute(status -> {
                    int batchUpserted = dynamicCbsQueryService.upsertToMirror(tableName, batchRef);

                    int batchValidated = 0;
                    int batchAnomalies = 0;
                    int batchAutoResolved = 0;
                    int batchErrors = 0;
                    if (doValidate) {
                        long valStart = System.currentTimeMillis();
                        CbsValidationService.ValidationResult vr =
                                cbsValidationService.validateRecords(tableName, batchRef);
                        batchValidated = vr.recordsValidated();
                        batchAnomalies = vr.anomaliesCreated();
                        batchAutoResolved = vr.autoResolved();
                        batchErrors = vr.errors();
                        metricsConfig.recordValidationBatch(tableName, batchAnomalies, batchAutoResolved,
                                System.currentTimeMillis() - valStart);
                        log.info("Table '{}': batch validated — anomalies={}, autoResolved={}, skipped={}",
                                tableName, vr.anomaliesCreated(), vr.autoResolved(), vr.duplicatesSkipped());
                    }
                    return new BatchResult(batchUpserted, batchValidated, batchAnomalies, batchErrors);
                });

                long batchDuration = System.currentTimeMillis() - batchStart;
                metricsConfig.recordSyncBatch(tableName, batch.size(), batchDuration, isCdc);

                if (br != null) {
                    upserted += br.upserted;
                    validated += br.validated;
                    anomaliesCreated += br.anomalies;
                    errors += br.errors;
                }

                // SSE: emit batch progress
                syncProgressService.emitBatchProgress(tableName, offset, batch.size(), totalCount,
                        br != null ? br.upserted : 0, br != null ? br.anomalies : 0, batchDuration);

                offset += BATCH_SIZE;
                if (batch.size() < BATCH_SIZE) break;
            }

            // Update last_sync_at for CDC (own transaction)
            if (tableEntity != null && cdcField != null) {
                transactionTemplate.executeWithoutResult(status -> {
                    tableEntity.setLastSyncAt(startTime);
                    cbsTableRepository.save(tableEntity);
                });
                log.info("Table '{}': updated lastSyncAt to {}", tableName, startTime);
            }

            long totalDuration = System.currentTimeMillis() - startTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
            metricsConfig.recordSyncTableComplete(tableName, upserted, totalDuration, isCdc);

            log.info("Sync completed for '{}': upserted={}, validated={}, anomalies={}, errors={}, CDC={}, duration={}ms",
                    tableName, upserted, validated, anomaliesCreated, errors, isCdc, totalDuration);

            // SSE: emit table complete
            syncProgressService.emitTableComplete(tableName, upserted, anomaliesCreated, errors, totalDuration, isCdc);

            return new SyncResult(tableName, upserted, validated, anomaliesCreated, errors, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failed to sync table '{}': {}", tableName, e.getMessage(), e);
            metricsConfig.recordDataSyncFailure();
            throw new RuntimeException("Sync failed for table " + tableName, e);
        }
    }

    private record BatchResult(int upserted, int validated, int anomalies, int errors) {}

    // ===== Helpers =====

    private String getString(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return null;
        String strValue = value.toString().trim();
        return strValue.isEmpty() ? null : strValue;
    }

    public record SyncResult(
            String entity, int upserted, int validated, int anomaliesCreated, int errors,
            LocalDateTime startTime, LocalDateTime endTime
    ) {
        public long durationSeconds() {
            return java.time.Duration.between(startTime, endTime).getSeconds();
        }
    }
}
