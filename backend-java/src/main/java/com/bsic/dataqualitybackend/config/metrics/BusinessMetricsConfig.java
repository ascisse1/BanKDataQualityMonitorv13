package com.bsic.dataqualitybackend.config.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Business metrics configuration for BSIC Data Quality Monitor.
 * Exposes custom Prometheus metrics for application-specific KPIs.
 */
@Getter
@Component
public class BusinessMetricsConfig {

    // Counters
    private final Counter anomaliesCreatedCounter;
    private final Counter anomaliesResolvedCounter;
    private final Counter ticketsCreatedCounter;
    private final Counter ticketsValidatedCounter;
    private final Counter ticketsRejectedCounter;
    private final Counter rpaJobsStartedCounter;
    private final Counter rpaJobsCompletedCounter;
    private final Counter rpaJobsFailedCounter;
    private final Counter dataSyncSuccessCounter;
    private final Counter dataSyncFailureCounter;
    private final Counter validationRulesTriggeredCounter;
    private final Counter cbsReconciliationCounter;

    // Gauges (atomic values)
    private final AtomicLong pendingTicketsGauge = new AtomicLong(0);
    private final AtomicLong pendingAnomaliesGauge = new AtomicLong(0);
    private final AtomicLong activeRpaJobsGauge = new AtomicLong(0);
    private final AtomicLong lastSyncTimestamp = new AtomicLong(0);

    // Timers
    private final Timer anomalyDetectionTimer;
    private final Timer ticketProcessingTimer;
    private final Timer rpaExecutionTimer;
    private final Timer dataSyncTimer;
    private final Timer cbsQueryTimer;

    public BusinessMetricsConfig(MeterRegistry registry) {
        // =============================================
        // Anomaly Metrics
        // =============================================
        this.anomaliesCreatedCounter = Counter.builder("bsic_anomalies_created_total")
                .description("Total number of anomalies created")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.anomaliesResolvedCounter = Counter.builder("bsic_anomalies_resolved_total")
                .description("Total number of anomalies resolved")
                .tag("application", "bsic-data-quality")
                .register(registry);

        Gauge.builder("bsic_anomalies_pending", pendingAnomaliesGauge, AtomicLong::get)
                .description("Current number of pending anomalies")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.anomalyDetectionTimer = Timer.builder("bsic_anomaly_detection_duration")
                .description("Time taken to detect anomalies")
                .tag("application", "bsic-data-quality")
                .register(registry);

        // =============================================
        // Ticket Metrics (4 Eyes Workflow)
        // =============================================
        this.ticketsCreatedCounter = Counter.builder("bsic_tickets_created_total")
                .description("Total number of tickets created")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.ticketsValidatedCounter = Counter.builder("bsic_tickets_validated_total")
                .description("Total number of tickets validated (approved)")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.ticketsRejectedCounter = Counter.builder("bsic_tickets_rejected_total")
                .description("Total number of tickets rejected")
                .tag("application", "bsic-data-quality")
                .register(registry);

        Gauge.builder("bsic_tickets_pending_validation", pendingTicketsGauge, AtomicLong::get)
                .description("Current number of tickets awaiting validation")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.ticketProcessingTimer = Timer.builder("bsic_ticket_processing_duration")
                .description("Time taken to process a ticket")
                .tag("application", "bsic-data-quality")
                .register(registry);

        // =============================================
        // RPA (UiPath) Metrics
        // =============================================
        this.rpaJobsStartedCounter = Counter.builder("bsic_rpa_jobs_started_total")
                .description("Total number of RPA jobs started")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.rpaJobsCompletedCounter = Counter.builder("bsic_rpa_jobs_completed_total")
                .description("Total number of RPA jobs completed successfully")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.rpaJobsFailedCounter = Counter.builder("bsic_rpa_jobs_failed_total")
                .description("Total number of RPA jobs that failed")
                .tag("application", "bsic-data-quality")
                .register(registry);

        Gauge.builder("bsic_rpa_jobs_active", activeRpaJobsGauge, AtomicLong::get)
                .description("Current number of active RPA jobs")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.rpaExecutionTimer = Timer.builder("bsic_rpa_execution_duration")
                .description("Time taken to execute RPA job")
                .tag("application", "bsic-data-quality")
                .register(registry);

        // =============================================
        // Data Synchronization Metrics
        // =============================================
        this.dataSyncSuccessCounter = Counter.builder("bsic_data_sync_success_total")
                .description("Total number of successful data synchronizations")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.dataSyncFailureCounter = Counter.builder("bsic_data_sync_failure_total")
                .description("Total number of failed data synchronizations")
                .tag("application", "bsic-data-quality")
                .register(registry);

        Gauge.builder("bsic_data_sync_last_success_timestamp", lastSyncTimestamp, AtomicLong::get)
                .description("Unix timestamp of last successful sync")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.dataSyncTimer = Timer.builder("bsic_data_sync_duration")
                .description("Time taken to complete data synchronization")
                .tag("application", "bsic-data-quality")
                .register(registry);

        // =============================================
        // CBS/Informix Metrics
        // =============================================
        this.cbsReconciliationCounter = Counter.builder("bsic_cbs_reconciliation_total")
                .description("Total CBS reconciliation operations")
                .tag("application", "bsic-data-quality")
                .register(registry);

        this.cbsQueryTimer = Timer.builder("bsic_cbs_query_duration")
                .description("Time taken for CBS queries")
                .tag("application", "bsic-data-quality")
                .register(registry);

        // =============================================
        // Validation Rules Metrics
        // =============================================
        this.validationRulesTriggeredCounter = Counter.builder("bsic_validation_rules_triggered_total")
                .description("Total validation rules triggered")
                .tag("application", "bsic-data-quality")
                .register(registry);
    }

    // =============================================
    // Convenience Methods
    // =============================================

    public void recordAnomalyCreated() {
        anomaliesCreatedCounter.increment();
    }

    public void recordAnomalyCreated(String clientType, String agency) {
        anomaliesCreatedCounter.increment();
    }

    public void recordAnomalyResolved() {
        anomaliesResolvedCounter.increment();
    }

    public void recordTicketCreated() {
        ticketsCreatedCounter.increment();
    }

    public void recordTicketValidated() {
        ticketsValidatedCounter.increment();
    }

    public void recordTicketRejected() {
        ticketsRejectedCounter.increment();
    }

    public void recordRpaJobStarted() {
        rpaJobsStartedCounter.increment();
        activeRpaJobsGauge.incrementAndGet();
    }

    public void recordRpaJobCompleted() {
        rpaJobsCompletedCounter.increment();
        activeRpaJobsGauge.decrementAndGet();
    }

    public void recordRpaJobFailed() {
        rpaJobsFailedCounter.increment();
        activeRpaJobsGauge.decrementAndGet();
    }

    public void recordDataSyncSuccess() {
        dataSyncSuccessCounter.increment();
        lastSyncTimestamp.set(System.currentTimeMillis() / 1000);
    }

    public void recordDataSyncFailure() {
        dataSyncFailureCounter.increment();
    }

    public void recordCbsReconciliation() {
        cbsReconciliationCounter.increment();
    }

    public void recordValidationRuleTriggered() {
        validationRulesTriggeredCounter.increment();
    }

    public void setPendingTickets(long count) {
        pendingTicketsGauge.set(count);
    }

    public void setPendingAnomalies(long count) {
        pendingAnomaliesGauge.set(count);
    }
}
