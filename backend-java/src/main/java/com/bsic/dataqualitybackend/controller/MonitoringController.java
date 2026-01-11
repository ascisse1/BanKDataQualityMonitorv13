package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.FrontendLogDto;
import com.bsic.dataqualitybackend.service.FrontendMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for frontend monitoring endpoints.
 * Receives logs, errors, and metrics from the frontend application.
 */
@Slf4j
@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final FrontendMonitoringService monitoringService;

    /**
     * Receive batch of logs from frontend.
     */
    @PostMapping("/logs")
    public ResponseEntity<Map<String, Object>> receiveLogs(@RequestBody FrontendLogDto logDto) {
        try {
            int processed = monitoringService.processLogs(logDto);
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "processed", processed
            ));
        } catch (Exception e) {
            log.error("Error processing frontend logs", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Receive single error report from frontend (for immediate error reporting).
     */
    @PostMapping("/error")
    public ResponseEntity<Map<String, Object>> receiveError(@RequestBody FrontendLogDto.LogEntry errorEntry) {
        try {
            monitoringService.processError(errorEntry);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            log.error("Error processing frontend error report", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get frontend monitoring statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(defaultValue = "1h") String period) {
        try {
            Map<String, Object> stats = monitoringService.getStatistics(period);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching monitoring stats", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Health check endpoint for monitoring service.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "frontend-monitoring"
        ));
    }
}
