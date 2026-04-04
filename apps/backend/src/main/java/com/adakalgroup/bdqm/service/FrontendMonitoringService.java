package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.FrontendLogDto;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for processing frontend monitoring data.
 * Handles log ingestion, metrics recording, and statistics aggregation.
 */
@Slf4j
@Service
public class FrontendMonitoringService {

    private final MeterRegistry meterRegistry;

    // Counters for frontend metrics
    private final Counter frontendLogCounter;
    private final Counter frontendErrorCounter;
    private final Counter frontendWarningCounter;
    private final Counter frontendApiErrorCounter;
    private final Counter frontendPageViewCounter;

    // Statistics tracking
    private final Map<String, AtomicLong> sessionCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> errorsByCategory = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> logsByLevel = new ConcurrentHashMap<>();
    private final AtomicLong totalLogsProcessed = new AtomicLong(0);
    private final AtomicLong totalErrorsProcessed = new AtomicLong(0);

    public FrontendMonitoringService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Initialize counters
        this.frontendLogCounter = Counter.builder("bdqm_frontend_logs_total")
                .description("Total frontend logs received")
                .tag("application", "bdqm")
                .register(meterRegistry);

        this.frontendErrorCounter = Counter.builder("bdqm_frontend_errors_total")
                .description("Total frontend errors received")
                .tag("application", "bdqm")
                .register(meterRegistry);

        this.frontendWarningCounter = Counter.builder("bdqm_frontend_warnings_total")
                .description("Total frontend warnings received")
                .tag("application", "bdqm")
                .register(meterRegistry);

        this.frontendApiErrorCounter = Counter.builder("bdqm_frontend_api_errors_total")
                .description("Total frontend API errors")
                .tag("application", "bdqm")
                .register(meterRegistry);

        this.frontendPageViewCounter = Counter.builder("bdqm_frontend_pageviews_total")
                .description("Total frontend page views")
                .tag("application", "bdqm")
                .register(meterRegistry);

        log.info("FrontendMonitoringService initialized");
    }

    /**
     * Process a batch of logs from the frontend.
     */
    public int processLogs(FrontendLogDto logDto) {
        if (logDto == null || logDto.getLogs() == null || logDto.getLogs().isEmpty()) {
            return 0;
        }

        String sessionId = logDto.getSessionId();
        String environment = logDto.getEnvironment();

        // Track unique sessions
        sessionCounts.computeIfAbsent(sessionId, k -> new AtomicLong(0)).incrementAndGet();

        int processed = 0;
        for (FrontendLogDto.LogEntry entry : logDto.getLogs()) {
            processLogEntry(entry, sessionId, environment);
            processed++;
        }

        totalLogsProcessed.addAndGet(processed);
        frontendLogCounter.increment(processed);

        log.debug("Processed {} logs from session {} (env: {})", processed, sessionId, environment);
        return processed;
    }

    /**
     * Process a single log entry.
     */
    private void processLogEntry(FrontendLogDto.LogEntry entry, String sessionId, String environment) {
        String level = entry.getLevel();
        String category = entry.getCategory();

        // Update level counters
        logsByLevel.computeIfAbsent(level, k -> new AtomicLong(0)).incrementAndGet();

        // Handle different log levels
        switch (level.toLowerCase()) {
            case "error":
                handleError(entry, sessionId, environment);
                break;
            case "warning":
                handleWarning(entry, sessionId, environment);
                break;
            case "info":
                handleInfo(entry, sessionId, environment);
                break;
            default:
                // Debug logs - minimal processing
                break;
        }

        // Track category-specific metrics
        if ("api".equals(category) && "error".equals(level)) {
            frontendApiErrorCounter.increment();
        }

        if ("user".equals(category) && entry.getMessage() != null &&
            entry.getMessage().startsWith("Page view:")) {
            frontendPageViewCounter.increment();
        }
    }

    /**
     * Handle error log entries.
     */
    private void handleError(FrontendLogDto.LogEntry entry, String sessionId, String environment) {
        frontendErrorCounter.increment();
        totalErrorsProcessed.incrementAndGet();

        String category = entry.getCategory();
        errorsByCategory.computeIfAbsent(category, k -> new AtomicLong(0)).incrementAndGet();

        // Log to backend logging system for persistent storage
        log.error("[FRONTEND][{}][{}] {} - User: {}, Path: {}, Session: {}",
                environment,
                category,
                entry.getMessage(),
                entry.getUserId(),
                entry.getPath(),
                sessionId);

        if (entry.getStack() != null) {
            log.error("[FRONTEND] Stack trace:\n{}", entry.getStack());
        }

        if (entry.getDetails() != null) {
            log.error("[FRONTEND] Details: {}", entry.getDetails());
        }

        // Create metric with category tag
        Counter.builder("bdqm_frontend_errors_by_category")
                .description("Frontend errors by category")
                .tag("category", category)
                .tag("environment", environment)
                .register(meterRegistry)
                .increment();
    }

    /**
     * Handle warning log entries.
     */
    private void handleWarning(FrontendLogDto.LogEntry entry, String sessionId, String environment) {
        frontendWarningCounter.increment();

        log.warn("[FRONTEND][{}][{}] {} - User: {}, Path: {}",
                environment,
                entry.getCategory(),
                entry.getMessage(),
                entry.getUserId(),
                entry.getPath());
    }

    /**
     * Handle info log entries.
     */
    private void handleInfo(FrontendLogDto.LogEntry entry, String sessionId, String environment) {
        // Only log significant info entries in production
        if ("production".equals(environment)) {
            // Log business-critical info
            if ("business".equals(entry.getCategory()) || "security".equals(entry.getCategory())) {
                log.info("[FRONTEND][{}][{}] {} - User: {}",
                        environment,
                        entry.getCategory(),
                        entry.getMessage(),
                        entry.getUserId());
            }
        } else {
            log.debug("[FRONTEND][{}][{}] {} - User: {}",
                    environment,
                    entry.getCategory(),
                    entry.getMessage(),
                    entry.getUserId());
        }
    }

    /**
     * Process a single error report (for immediate error reporting).
     */
    public void processError(FrontendLogDto.LogEntry errorEntry) {
        handleError(errorEntry, errorEntry.getSessionId(), "unknown");
    }

    /**
     * Get monitoring statistics for a given period.
     */
    public Map<String, Object> getStatistics(String period) {
        return Map.of(
                "totalLogsProcessed", totalLogsProcessed.get(),
                "totalErrorsProcessed", totalErrorsProcessed.get(),
                "uniqueSessions", sessionCounts.size(),
                "errorsByCategory", errorsByCategory,
                "logsByLevel", logsByLevel,
                "period", period
        );
    }

    /**
     * Get error count for alerting purposes.
     */
    public long getErrorCount() {
        return totalErrorsProcessed.get();
    }

    /**
     * Get active session count.
     */
    public int getActiveSessionCount() {
        return sessionCounts.size();
    }

    /**
     * Reset statistics (for testing or periodic cleanup).
     */
    public void resetStatistics() {
        sessionCounts.clear();
        errorsByCategory.clear();
        logsByLevel.clear();
        totalLogsProcessed.set(0);
        totalErrorsProcessed.set(0);
        log.info("Frontend monitoring statistics reset");
    }
}
