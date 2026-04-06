package com.adakalgroup.bdqm.config.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Business metrics configuration for Data Quality Monitor.
 * Exposes custom Prometheus metrics for application-specific KPIs.
 */
@Getter
@Component
public class BusinessMetricsConfig {

    private final MeterRegistry registry;

    // Counters
    private final Counter anomaliesCreatedCounter;
    private final Counter anomaliesResolvedCounter;
    private final Counter ticketsCreatedCounter;
    private final Counter ticketsValidatedCounter;
    private final Counter ticketsRejectedCounter;
    private final Counter dataSyncSuccessCounter;
    private final Counter dataSyncFailureCounter;
    private final Counter validationRulesTriggeredCounter;
    private final Counter cbsReconciliationCounter;

    // Gauges (atomic values)
    private final AtomicLong pendingTicketsGauge = new AtomicLong(0);
    private final AtomicLong pendingAnomaliesGauge = new AtomicLong(0);
    private final AtomicLong lastSyncTimestamp = new AtomicLong(0);

    // Timers
    private final Timer anomalyDetectionTimer;
    private final Timer ticketProcessingTimer;
    private final Timer dataSyncTimer;
    private final Timer cbsQueryTimer;

    public BusinessMetricsConfig(MeterRegistry registry) {
        this.registry = registry;
        // =============================================
        // Anomaly Metrics
        // =============================================
        this.anomaliesCreatedCounter = Counter.builder("bdqm_anomalies_created_total")
                .description("Total number of anomalies created")
                .tag("application", "bdqm")
                .register(registry);

        this.anomaliesResolvedCounter = Counter.builder("bdqm_anomalies_resolved_total")
                .description("Total number of anomalies resolved")
                .tag("application", "bdqm")
                .register(registry);

        Gauge.builder("bdqm_anomalies_pending", pendingAnomaliesGauge, AtomicLong::get)
                .description("Current number of pending anomalies")
                .tag("application", "bdqm")
                .register(registry);

        this.anomalyDetectionTimer = Timer.builder("bdqm_anomaly_detection_duration")
                .description("Time taken to detect anomalies")
                .tag("application", "bdqm")
                .register(registry);

        // =============================================
        // Ticket Metrics (4 Eyes Workflow)
        // =============================================
        this.ticketsCreatedCounter = Counter.builder("bdqm_tickets_created_total")
                .description("Total number of tickets created")
                .tag("application", "bdqm")
                .register(registry);

        this.ticketsValidatedCounter = Counter.builder("bdqm_tickets_validated_total")
                .description("Total number of tickets validated (approved)")
                .tag("application", "bdqm")
                .register(registry);

        this.ticketsRejectedCounter = Counter.builder("bdqm_tickets_rejected_total")
                .description("Total number of tickets rejected")
                .tag("application", "bdqm")
                .register(registry);

        Gauge.builder("bdqm_tickets_pending_validation", pendingTicketsGauge, AtomicLong::get)
                .description("Current number of tickets awaiting validation")
                .tag("application", "bdqm")
                .register(registry);

        this.ticketProcessingTimer = Timer.builder("bdqm_ticket_processing_duration")
                .description("Time taken to process a ticket")
                .tag("application", "bdqm")
                .register(registry);

        // =============================================
        // Data Synchronization Metrics
        // =============================================
        this.dataSyncSuccessCounter = Counter.builder("bdqm_data_sync_success_total")
                .description("Total number of successful data synchronizations")
                .tag("application", "bdqm")
                .register(registry);

        this.dataSyncFailureCounter = Counter.builder("bdqm_data_sync_failure_total")
                .description("Total number of failed data synchronizations")
                .tag("application", "bdqm")
                .register(registry);

        Gauge.builder("bdqm_data_sync_last_success_timestamp", lastSyncTimestamp, AtomicLong::get)
                .description("Unix timestamp of last successful sync")
                .tag("application", "bdqm")
                .register(registry);

        this.dataSyncTimer = Timer.builder("bdqm_data_sync_duration")
                .description("Time taken to complete data synchronization")
                .tag("application", "bdqm")
                .register(registry);

        // =============================================
        // CBS/Informix Metrics
        // =============================================
        this.cbsReconciliationCounter = Counter.builder("bdqm_cbs_reconciliation_total")
                .description("Total CBS reconciliation operations")
                .tag("application", "bdqm")
                .register(registry);

        this.cbsQueryTimer = Timer.builder("bdqm_cbs_query_duration")
                .description("Time taken for CBS queries")
                .tag("application", "bdqm")
                .register(registry);

        // =============================================
        // Validation Rules Metrics
        // =============================================
        this.validationRulesTriggeredCounter = Counter.builder("bdqm_validation_rules_triggered_total")
                .description("Total validation rules triggered")
                .tag("application", "bdqm")
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

    // =============================================
    // Granular Sync Metrics (per-table, per-batch)
    // =============================================

    public void recordSyncBatch(String tableName, int recordCount, long durationMs, boolean cdc) {
        Counter.builder("bdqm_sync_records_total")
                .description("Total records synced")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .tag("cdc", String.valueOf(cdc))
                .register(registry)
                .increment(recordCount);

        Timer.builder("bdqm_sync_batch_duration")
                .description("Duration of sync batch processing")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .register(registry)
                .record(java.time.Duration.ofMillis(durationMs));
    }

    public void recordValidationBatch(String tableName, int anomaliesCreated, int autoResolved, long durationMs) {
        Counter.builder("bdqm_validation_anomalies_created_total")
                .description("Anomalies created during validation")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .register(registry)
                .increment(anomaliesCreated);

        Counter.builder("bdqm_validation_auto_resolved_total")
                .description("Anomalies auto-resolved during validation")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .register(registry)
                .increment(autoResolved);

        Timer.builder("bdqm_validation_batch_duration")
                .description("Duration of validation batch processing")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .register(registry)
                .record(java.time.Duration.ofMillis(durationMs));
    }

    public void recordSyncTableComplete(String tableName, int totalRecords, long totalDurationMs, boolean cdc) {
        Timer.builder("bdqm_sync_table_duration")
                .description("Total duration for syncing a CBS table")
                .tag("application", "bdqm")
                .tag("table", tableName)
                .tag("cdc", String.valueOf(cdc))
                .register(registry)
                .record(java.time.Duration.ofMillis(totalDurationMs));

        if (totalDurationMs > 0 && totalRecords > 0) {
            double recordsPerSec = (totalRecords * 1000.0) / totalDurationMs;
            Gauge.builder("bdqm_sync_records_per_second", () -> recordsPerSec)
                    .description("Records processed per second (last sync)")
                    .tag("application", "bdqm")
                    .tag("table", tableName)
                    .register(registry);
        }
    }
}
