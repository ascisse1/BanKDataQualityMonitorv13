package com.adakalgroup.bdqm.scheduler;

import com.adakalgroup.bdqm.config.metrics.BusinessMetricsConfig;
import com.adakalgroup.bdqm.model.enums.AnomalyStatus;
import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import com.adakalgroup.bdqm.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler that periodically updates gauge metrics with current values from the database.
 * Updates every minute to keep Prometheus metrics current.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsUpdateScheduler {

    private final BusinessMetricsConfig metricsConfig;
    private final AnomalyRepository anomalyRepository;
    private final TicketRepository ticketRepository;

    /**
     * Update gauge metrics every minute.
     * Runs at second 0 of every minute.
     */
    @Scheduled(cron = "0 * * * * *")
    public void updateGaugeMetrics() {
        try {
            updatePendingAnomaliesGauge();
            updatePendingTicketsGauge();
            log.debug("Metrics gauges updated successfully");
        } catch (Exception e) {
            log.error("Failed to update metrics gauges", e);
        }
    }

    private void updatePendingAnomaliesGauge() {
        try {
            long pendingCount = anomalyRepository.countByStatus(AnomalyStatus.PENDING);
            metricsConfig.setPendingAnomalies(pendingCount);
        } catch (Exception e) {
            log.warn("Could not update pending anomalies gauge: {}", e.getMessage());
        }
    }

    private void updatePendingTicketsGauge() {
        try {
            long pendingCount = ticketRepository.countByStatus(TicketStatus.PENDING_VALIDATION);
            metricsConfig.setPendingTickets(pendingCount);
        } catch (Exception e) {
            log.warn("Could not update pending tickets gauge: {}", e.getMessage());
        }
    }
}
