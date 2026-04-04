package com.adakalgroup.dataqualitybackend.scheduler;

import com.adakalgroup.dataqualitybackend.service.FatcaScreeningService;
import com.adakalgroup.dataqualitybackend.service.FatcaScreeningService.ScreeningResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for FATCA US indicia screening.
 * Runs after the CBS data sync to scan newly synced clients for US indicators.
 *
 * Only active when informix-integration feature is enabled
 * (screening depends on synced CBS data in PostgreSQL).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class FatcaScreeningScheduler {

    private final FatcaScreeningService fatcaScreeningService;
    private volatile ScreeningResult lastResult;
    private volatile long lastRunTimestamp;

    @Autowired
    public FatcaScreeningScheduler(@Autowired(required = false) FatcaScreeningService fatcaScreeningService) {
        this.fatcaScreeningService = fatcaScreeningService;
        if (fatcaScreeningService == null) {
            log.warn("FatcaScreeningService not available - screening jobs will be skipped");
        } else {
            log.info("FatcaScreeningScheduler initialized successfully");
        }
    }

    /**
     * Run FATCA US indicia screening on all clients.
     * Default schedule: Daily at 3:30 AM (after CBS sync at 2:00 AM).
     * Configurable via app.scheduling.fatca-screening-cron property.
     */
    @Scheduled(cron = "${app.scheduling.fatca-screening-cron:0 30 3 * * ?}")
    public void screenClients() {
        log.info("=== Starting scheduled FATCA screening job ===");

        if (fatcaScreeningService == null) {
            log.warn("FatcaScreeningService not available - skipping FATCA screening");
            return;
        }

        try {
            ScreeningResult result = fatcaScreeningService.screenAllClients();
            lastResult = result;
            lastRunTimestamp = System.currentTimeMillis();

            log.info("=== FATCA screening job completed ===");
            log.info("Results: Scanned={}, NewDetections={}, Updated={}, Errors={}",
                result.totalScanned(), result.newDetections(),
                result.updated(), result.errors());

        } catch (Exception e) {
            log.error("=== FATCA screening job FAILED ===");
            log.error("Error: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for FATCA screening (called from controller).
     */
    public ScreeningResult triggerScreening() {
        if (fatcaScreeningService == null) {
            throw new IllegalStateException("FatcaScreeningService not available");
        }
        log.info("Manual FATCA screening triggered");
        ScreeningResult result = fatcaScreeningService.screenAllClients();
        lastResult = result;
        lastRunTimestamp = System.currentTimeMillis();
        return result;
    }

    public ScreeningResult getLastResult() {
        return lastResult;
    }

    public long getLastRunTimestamp() {
        return lastRunTimestamp;
    }
}
