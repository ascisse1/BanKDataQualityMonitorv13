package com.bsic.dataqualitybackend.scheduler;

import com.bsic.dataqualitybackend.service.DataSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduler for dictionary-driven CBS data sync.
 * Syncs all enabled tables from cbs_tables (sync_enabled=true, ordered by sync_order).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DataSyncScheduler {

    private final DataSyncService dataSyncService;

    @Autowired
    public DataSyncScheduler(@Autowired(required = false) DataSyncService dataSyncService) {
        this.dataSyncService = dataSyncService;
        if (dataSyncService == null) {
            log.warn("DataSyncService not available - sync jobs will be skipped");
        } else {
            log.info("DataSyncScheduler initialized successfully");
        }
    }

    /**
     * Scheduled sync of all enabled CBS tables.
     * Default: Daily at 2:00 AM. Configurable via app.scheduling.cbs-sync-cron.
     */
    @Scheduled(cron = "${app.scheduling.cbs-sync-cron:0 0 2 * * ?}")
    public void syncAll() {
        log.info("=== Starting scheduled CBS sync (dictionary-driven) ===");

        if (dataSyncService == null) {
            log.warn("DataSyncService not available - skipping sync");
            return;
        }

        try {
            List<DataSyncService.SyncResult> results = dataSyncService.syncAll();

            for (DataSyncService.SyncResult r : results) {
                log.info("  Table '{}': upserted={}, errors={}, duration={}s",
                        r.entity(), r.inserted(), r.errors(), r.durationSeconds());
            }

            log.info("=== CBS sync completed: {} tables synced ===", results.size());
        } catch (Exception e) {
            log.error("=== CBS sync FAILED ===: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger: sync all enabled tables.
     */
    public List<DataSyncService.SyncResult> triggerSyncAll() {
        if (dataSyncService == null) {
            throw new IllegalStateException("DataSyncService not available");
        }
        log.info("Manual full CBS sync triggered");
        return dataSyncService.syncAll();
    }

    /**
     * Manual trigger: sync a specific table.
     */
    public DataSyncService.SyncResult triggerSyncTable(String tableName) {
        if (dataSyncService == null) {
            throw new IllegalStateException("DataSyncService not available");
        }
        log.info("Manual sync triggered for table '{}'", tableName);
        return dataSyncService.syncTable(tableName);
    }

    // ===== Legacy methods (backward compatibility) =====

    /** @deprecated Use {@link #triggerSyncAll()} */
    @Deprecated
    public DataSyncService.SyncResult triggerClientSync() {
        return triggerSyncTable("bkcli");
    }

    /** @deprecated Use {@link #triggerSyncAll()} */
    @Deprecated
    public DataSyncService.SyncResult triggerAgencySync() {
        return triggerSyncTable("bkage");
    }

    /** @deprecated Use {@link #triggerSyncAll()} */
    @Deprecated
    public DataSyncService.SyncResult triggerClientSyncBatch() {
        return triggerSyncTable("bkcli");
    }
}
