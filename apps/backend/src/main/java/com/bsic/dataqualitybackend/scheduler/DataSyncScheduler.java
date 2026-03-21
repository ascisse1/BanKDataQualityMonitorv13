package com.bsic.dataqualitybackend.scheduler;

import com.bsic.dataqualitybackend.service.DataSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for synchronizing data from Informix CBS to MySQL.
 * Runs cron jobs for BKCLI (clients) and BKAGE (agencies) sync.
 *
 * Only active when informix-integration feature is enabled.
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
     * Sync BKCLI (clients) from Informix to MySQL.
     * Default schedule: Daily at 2:00 AM.
     * Configurable via app.scheduling.bkcli-sync-cron property.
     */
    @Scheduled(cron = "${app.scheduling.bkcli-sync-cron:0 0 2 * * ?}")
    public void syncClients() {
        log.info("=== Starting scheduled BKCLI sync job ===");

        if (dataSyncService == null) {
            log.warn("DataSyncService not available - skipping BKCLI sync");
            return;
        }

        try {
            DataSyncService.SyncResult result = dataSyncService.syncClients();

            log.info("=== BKCLI sync job completed ===");
            log.info("Results: Inserted={}, Updated={}, Errors={}, Duration={}s",
                    result.inserted(),
                    result.updated(),
                    result.errors(),
                    result.durationSeconds());

        } catch (Exception e) {
            log.error("=== BKCLI sync job FAILED ===");
            log.error("Error: {}", e.getMessage(), e);
        }
    }

    /**
     * Sync BKAGE (agencies) from Informix to MySQL.
     * Default schedule: Daily at 2:30 AM.
     * Configurable via app.scheduling.agency-sync-cron property.
     */
    @Scheduled(cron = "${app.scheduling.agency-sync-cron:0 30 2 * * ?}")
    public void syncAgencies() {
        log.info("=== Starting scheduled BKAGE (agencies) sync job ===");

        if (dataSyncService == null) {
            log.warn("DataSyncService not available - skipping BKAGE sync");
            return;
        }

        try {
            DataSyncService.SyncResult result = dataSyncService.syncAgencies();

            log.info("=== BKAGE sync job completed ===");
            log.info("Results: Inserted={}, Updated={}, Errors={}, Duration={}s",
                    result.inserted(),
                    result.updated(),
                    result.errors(),
                    result.durationSeconds());

        } catch (Exception e) {
            log.error("=== BKAGE sync job FAILED ===");
            log.error("Error: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for BKCLI sync (can be called from controller).
     */
    public DataSyncService.SyncResult triggerClientSync() {
        if (dataSyncService == null) {
            throw new IllegalStateException("DataSyncService not available");
        }
        log.info("Manual BKCLI sync triggered");
        return dataSyncService.syncClients();
    }

    /**
     * Manual trigger for agencies sync (can be called from controller).
     */
    public DataSyncService.SyncResult triggerAgencySync() {
        if (dataSyncService == null) {
            throw new IllegalStateException("DataSyncService not available");
        }
        log.info("Manual agencies sync triggered");
        return dataSyncService.syncAgencies();
    }

    /**
     * Manual trigger for batched BKCLI sync (for very large datasets).
     */
    public DataSyncService.SyncResult triggerClientSyncBatch() {
        if (dataSyncService == null) {
            throw new IllegalStateException("DataSyncService not available");
        }
        log.info("Manual batched BKCLI sync triggered");
        return dataSyncService.syncClientsBatch();
    }
}
