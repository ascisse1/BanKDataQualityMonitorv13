package com.bsic.dataqualitybackend.scheduler;

import com.bsic.dataqualitybackend.service.ReconciliationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Scheduler for batch reconciliation of pending tasks.
 * Runs at a configurable cron time to process all pending reconciliation tasks.
 *
 * Only active when both informix-integration and batch-reconciliation features are enabled.
 */
@Slf4j
@Component
@ConditionalOnProperty(
        name = {"app.features.informix-integration", "app.features.batch-reconciliation"},
        havingValue = "true",
        matchIfMissing = false
)
public class ReconciliationScheduler {

    private final ReconciliationService reconciliationService;
    private final int maxTasks;

    public ReconciliationScheduler(
            ReconciliationService reconciliationService,
            @Value("${app.scheduling.reconciliation-max-tasks:100}") int maxTasks) {
        this.reconciliationService = reconciliationService;
        this.maxTasks = maxTasks;
        log.info("ReconciliationScheduler initialized — batch reconciliation enabled (max {} tasks per run)", maxTasks);
    }

    /**
     * Batch reconciliation of all pending tasks.
     * Default schedule: Daily at 3:00 AM.
     * Configurable via app.scheduling.reconciliation-cron property.
     */
    @Scheduled(cron = "${app.scheduling.reconciliation-cron:0 0 3 * * ?}")
    public void reconcilePendingTasks() {
        log.info("=== Starting scheduled batch reconciliation ===");

        try {
            Map<String, Object> result = reconciliationService.reconcileAll(null, maxTasks);

            log.info("=== Batch reconciliation completed ===");
            log.info("Results: Success={}, Failed={}, Abandoned={}, Total={}",
                    result.get("success"),
                    result.get("failed"),
                    result.get("abandoned"),
                    result.get("total"));

        } catch (Exception e) {
            log.error("=== Batch reconciliation FAILED ===");
            log.error("Error: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for batch reconciliation (can be called from controller).
     */
    public Map<String, Object> triggerReconciliation() {
        log.info("Manual batch reconciliation triggered");
        return reconciliationService.reconcileAll(null, maxTasks);
    }
}
