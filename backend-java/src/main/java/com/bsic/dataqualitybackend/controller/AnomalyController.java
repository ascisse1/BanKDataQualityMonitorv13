package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.service.AnomalyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnomalyController {

    private final AnomalyService anomalyService;

    @GetMapping("/individual")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<Page<AnomalyDto>>> getIndividualAnomalies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<AnomalyDto> anomalies = anomalyService.getAnomaliesByClientType(
            ClientType.INDIVIDUAL, page, size);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/corporate")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<Page<AnomalyDto>>> getCorporateAnomalies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<AnomalyDto> anomalies = anomalyService.getAnomaliesByClientType(
            ClientType.CORPORATE, page, size);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/institutional")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<Page<AnomalyDto>>> getInstitutionalAnomalies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<AnomalyDto> anomalies = anomalyService.getAnomaliesByClientType(
            ClientType.INSTITUTIONAL, page, size);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/by-branch")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAnomaliesByBranch(
            @RequestParam(defaultValue = "INDIVIDUAL") ClientType clientType) {

        List<Map<String, Object>> anomalies = anomalyService.getAnomaliesByBranch(clientType);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/by-agency/{agencyCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<Page<AnomalyDto>>> getAnomaliesByAgency(
            @PathVariable String agencyCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<AnomalyDto> anomalies = anomalyService.getAnomaliesByAgency(agencyCode, page, size);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/by-status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<AnomalyDto>>> getAnomaliesByStatus(
            @PathVariable AnomalyStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<AnomalyDto> anomalies = anomalyService.getAnomaliesByStatus(status, page, size);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<AnomalyDto>>> getRecentAnomalies(
            @RequestParam(defaultValue = "10") int limit) {

        List<AnomalyDto> anomalies = anomalyService.getRecentAnomalies(limit);

        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    @GetMapping("/counts/by-type")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAnomalyCountsByType() {
        Map<String, Long> counts = anomalyService.getAnomalyCountsByClientType();
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @GetMapping("/counts/by-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAnomalyCountsByStatus() {
        Map<String, Long> counts = anomalyService.getAnomalyCountsByStatus();
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @GetMapping("/top-fields/{clientType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopAnomalyFields(
            @PathVariable ClientType clientType,
            @RequestParam(defaultValue = "10") int limit) {

        List<Map<String, Object>> topFields = anomalyService.getTopAnomalyFields(clientType, limit);

        return ResponseEntity.ok(ApiResponse.success(topFields));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAnomalyTrends(
            @RequestParam(defaultValue = "30") int days) {

        List<Map<String, Object>> trends = anomalyService.getAnomalyTrends(days);

        return ResponseEntity.ok(ApiResponse.success(trends));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnomalyDto>> createAnomaly(@RequestBody AnomalyDto anomalyDto) {
        AnomalyDto created = anomalyService.createAnomaly(anomalyDto);
        return ResponseEntity.ok(ApiResponse.success("Anomalie créée avec succès", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<AnomalyDto>> updateAnomaly(
            @PathVariable Long id,
            @RequestBody AnomalyDto anomalyDto) {

        AnomalyDto updated = anomalyService.updateAnomaly(id, anomalyDto);
        return ResponseEntity.ok(ApiResponse.success("Anomalie mise à jour avec succès", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAnomaly(@PathVariable Long id) {
        anomalyService.deleteAnomaly(id);
        return ResponseEntity.ok(ApiResponse.success("Anomalie supprimée avec succès", null));
    }
}
