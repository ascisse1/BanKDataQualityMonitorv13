package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.scheduler.DataSyncScheduler;
import com.adakalgroup.bdqm.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for dictionary-driven CBS data sync.
 * Supports syncing all enabled tables or a specific table by name.
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
@PreAuthorize("hasRole('ADMIN')")
public class DataSyncController {

    private final DataSyncScheduler dataSyncScheduler;

    /**
     * Sync ALL enabled CBS tables (dictionary-driven).
     * Tables are determined by cbs_tables where sync_enabled=true.
     */
    @PostMapping("/all")
    public ResponseEntity<Map<String, Object>> syncAll() {
        log.info("Manual full CBS sync requested via API");
        try {
            List<DataSyncService.SyncResult> results = dataSyncScheduler.triggerSyncAll();
            List<Map<String, Object>> tableResults = results.stream()
                    .map(this::buildResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tablesProcessed", results.size(),
                    "results", tableResults
            ));
        } catch (Exception e) {
            log.error("Full sync failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Sync a specific CBS table by name (e.g., bkcli, bkage, bkcom...).
     */
    @PostMapping("/table/{tableName}")
    public ResponseEntity<Map<String, Object>> syncTable(@PathVariable String tableName) {
        log.info("Manual sync requested for table '{}' via API", tableName);
        try {
            DataSyncService.SyncResult result = dataSyncScheduler.triggerSyncTable(tableName);
            return ResponseEntity.ok(buildResponse(result));
        } catch (Exception e) {
            log.error("Sync failed for table '{}': {}", tableName, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    private Map<String, Object> buildResponse(DataSyncService.SyncResult result) {
        return Map.of(
                "success", true,
                "table", result.entity(),
                "upserted", result.inserted(),
                "errors", result.errors(),
                "totalProcessed", result.totalProcessed(),
                "durationSeconds", result.durationSeconds(),
                "startTime", result.startTime().toString(),
                "endTime", result.endTime().toString()
        );
    }
}
