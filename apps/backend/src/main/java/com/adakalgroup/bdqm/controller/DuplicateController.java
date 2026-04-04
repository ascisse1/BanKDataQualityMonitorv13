package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.*;
import com.adakalgroup.bdqm.service.DuplicateDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/duplicates")
@Slf4j
@RequiredArgsConstructor
public class DuplicateController {

    private final DuplicateDetectionService duplicateDetectionService;

    @GetMapping("/detect")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<List<DuplicateCandidateDto>> detectDuplicates(
            @RequestParam(required = false) String client_type,
            @RequestParam(required = false) Double min_score) {
        try {
            return ResponseEntity.ok(duplicateDetectionService.detectDuplicates(client_type, min_score));
        } catch (Exception e) {
            log.error("Error detecting duplicates: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<List<DuplicateCandidateDto>> getPendingDuplicates(
            @RequestParam(required = false) String client_type) {
        try {
            return ResponseEntity.ok(duplicateDetectionService.getPendingDuplicates(client_type));
        } catch (Exception e) {
            log.error("Error fetching pending duplicates: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<DuplicateDetailDto> getDuplicateDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(duplicateDetectionService.getDuplicateDetail(id));
        } catch (Exception e) {
            log.error("Error fetching duplicate detail {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Void> confirmDuplicate(
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            duplicateDetectionService.confirmDuplicate(
                    id, request.get("user_id"), request.get("comments"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error confirming duplicate {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<Void> rejectDuplicate(
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            duplicateDetectionService.rejectDuplicate(
                    id, request.get("user_id"), request.get("reason"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error rejecting duplicate {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/merge")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> mergeDuplicate(
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            duplicateDetectionService.mergeDuplicate(
                    id,
                    request.get("keep_client_id"),
                    request.get("merge_client_id"),
                    request.get("user_id"),
                    request.get("comments"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error merging duplicate {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<DuplicateStatsDto> getStats() {
        try {
            return ResponseEntity.ok(duplicateDetectionService.getStats());
        } catch (Exception e) {
            log.error("Error fetching duplicate stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/run-detection")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> runDetection(@RequestBody Map<String, Object> request) {
        try {
            String clientType = (String) request.get("client_type");
            int batchSize = request.containsKey("batch_size")
                    ? ((Number) request.get("batch_size")).intValue()
                    : 1000;

            Map<String, Object> result = duplicateDetectionService.runDetection(clientType, batchSize);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error running duplicate detection: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
