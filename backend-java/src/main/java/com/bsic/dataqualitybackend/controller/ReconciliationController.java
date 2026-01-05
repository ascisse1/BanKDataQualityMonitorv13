package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reconciliation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<List<Map<String, Object>>> getPendingTasks(
            @RequestParam(required = false) String agencyCode,
            @RequestParam(required = false) String clientId) {

        try {
            List<Map<String, Object>> tasks = reconciliationService.getPendingTasks(agencyCode, clientId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("Error fetching pending reconciliations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam(required = false) String ticketId,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        try {
            List<Map<String, Object>> tasks = reconciliationService.getReconciliationHistory(
                    ticketId, clientId, status, startDate, endDate
            );
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("Error fetching reconciliation history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(required = false) String agencyCode) {

        try {
            Map<String, Object> stats = reconciliationService.getStats(agencyCode);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching reconciliation stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> reconcileTask(@PathVariable String id) {
        try {
            Map<String, Object> result = reconciliationService.reconcileTask(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error reconciling task {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage(),
                    "task_id", id
            ));
        }
    }

    @PostMapping("/{id}/retry")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> retryReconciliation(@PathVariable String id) {
        try {
            Map<String, Object> result = reconciliationService.reconcileTask(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error retrying reconciliation for task {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage(),
                    "task_id", id
            ));
        }
    }

    @PostMapping("/reconcile-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> reconcileAll(
            @RequestBody Map<String, Object> request) {

        try {
            String agencyCode = (String) request.get("agency_code");
            Integer maxTasks = request.containsKey("max_tasks")
                    ? (Integer) request.get("max_tasks")
                    : 50;

            Map<String, Object> result = reconciliationService.reconcileAll(agencyCode, maxTasks);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in batch reconciliation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Reconciliation Service",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
