package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.scheduler.ReconciliationScheduler;
import com.adakalgroup.dataqualitybackend.security.StructureSecurityService;
import com.adakalgroup.dataqualitybackend.service.ReconciliationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.adakalgroup.dataqualitybackend.model.ReconciliationAttempt;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reconciliation")
@Slf4j
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final StructureSecurityService structureSecurityService;

    @Value("${app.features.batch-reconciliation:false}")
    private boolean batchReconciliationEnabled;

    @Value("${app.scheduling.reconciliation-cron:0 0 3 * * ?}")
    private String reconciliationCron;

    @Autowired(required = false)
    private ReconciliationScheduler reconciliationScheduler;

    public ReconciliationController(ReconciliationService reconciliationService,
                                    StructureSecurityService structureSecurityService) {
        this.reconciliationService = reconciliationService;
        this.structureSecurityService = structureSecurityService;
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<List<Map<String, Object>>> getPendingTasks(
            @RequestParam(required = false) String structureCode,
            @RequestParam(required = false) String clientId) {

        try {
            if (structureCode != null) {
                structureSecurityService.requireAgencyAccess(structureCode);
            }
            List<Map<String, Object>> tasks = reconciliationService.getPendingTasks(structureCode, clientId);
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
            @RequestParam(required = false) String structureCode) {

        try {
            if (structureCode != null) {
                structureSecurityService.requireAgencyAccess(structureCode);
            }
            Map<String, Object> stats = reconciliationService.getStats(structureCode);
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
            String structureCode = (String) request.get("structure_code");
            if (structureCode != null) {
                structureSecurityService.requireAgencyAccess(structureCode);
            }
            Integer maxTasks = request.containsKey("max_tasks")
                    ? (Integer) request.get("max_tasks")
                    : 50;

            Map<String, Object> result = reconciliationService.reconcileAll(structureCode, maxTasks);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in batch reconciliation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/abandon")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> abandonAndCreateAnomaly(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";
            Map<String, Object> result = reconciliationService.abandonAndCreateAnomaly(id, username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error abandoning task {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "task_id", id));
        }
    }

    @GetMapping("/{id}/attempts")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<List<ReconciliationAttempt>> getAttempts(@PathVariable String id) {
        try {
            return ResponseEntity.ok(reconciliationService.getAttempts(id));
        } catch (Exception e) {
            log.error("Error fetching attempts for task {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/batch-config")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Map<String, Object>> getBatchConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("batch_reconciliation_enabled", batchReconciliationEnabled);
        config.put("reconciliation_cron", reconciliationCron);
        config.put("scheduler_active", reconciliationScheduler != null);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/trigger-batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> triggerBatchReconciliation() {
        if (reconciliationScheduler == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Batch reconciliation is not enabled. Set app.features.batch-reconciliation=true and app.features.informix-integration=true"));
        }
        try {
            Map<String, Object> result = reconciliationScheduler.triggerReconciliation();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error triggering batch reconciliation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Reconciliation Service");
        status.put("batch_mode", batchReconciliationEnabled);
        status.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(status);
    }
}
