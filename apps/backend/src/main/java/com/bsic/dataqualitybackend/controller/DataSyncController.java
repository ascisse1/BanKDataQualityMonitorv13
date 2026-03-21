package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.scheduler.DataSyncScheduler;
import com.bsic.dataqualitybackend.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for manually triggering data sync operations.
 * Only available when informix-integration feature is enabled.
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DataSyncController {

    private final DataSyncScheduler dataSyncScheduler;

    /**
     * Manually trigger BKCLI (clients) sync from Informix to MySQL.
     */
    @PostMapping("/clients")
    public ResponseEntity<Map<String, Object>> syncClients() {
        log.info("Manual client sync requested via API");

        try {
            DataSyncService.SyncResult result = dataSyncScheduler.triggerClientSync();
            return ResponseEntity.ok(buildResponse(result));
        } catch (Exception e) {
            log.error("Client sync failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Manually trigger BKCLI sync using batch processing (for large datasets).
     */
    @PostMapping("/clients/batch")
    public ResponseEntity<Map<String, Object>> syncClientsBatch() {
        log.info("Manual batched client sync requested via API");

        try {
            DataSyncService.SyncResult result = dataSyncScheduler.triggerClientSyncBatch();
            return ResponseEntity.ok(buildResponse(result));
        } catch (Exception e) {
            log.error("Batched client sync failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Manually trigger agencies sync from Informix to MySQL.
     */
    @PostMapping("/agencies")
    public ResponseEntity<Map<String, Object>> syncAgencies() {
        log.info("Manual agency sync requested via API");

        try {
            DataSyncService.SyncResult result = dataSyncScheduler.triggerAgencySync();
            return ResponseEntity.ok(buildResponse(result));
        } catch (Exception e) {
            log.error("Agency sync failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Trigger full sync (clients + agencies).
     */
    @PostMapping("/all")
    public ResponseEntity<Map<String, Object>> syncAll() {
        log.info("Manual full sync requested via API");

        try {
            DataSyncService.SyncResult clientResult = dataSyncScheduler.triggerClientSync();
            DataSyncService.SyncResult agencyResult = dataSyncScheduler.triggerAgencySync();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "clients", buildResponse(clientResult),
                    "agencies", buildResponse(agencyResult)
            ));
        } catch (Exception e) {
            log.error("Full sync failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    private Map<String, Object> buildResponse(DataSyncService.SyncResult result) {
        return Map.of(
                "success", true,
                "entity", result.entity(),
                "inserted", result.inserted(),
                "updated", result.updated(),
                "errors", result.errors(),
                "totalProcessed", result.totalProcessed(),
                "durationSeconds", result.durationSeconds(),
                "startTime", result.startTime().toString(),
                "endTime", result.endTime().toString()
        );
    }
}
