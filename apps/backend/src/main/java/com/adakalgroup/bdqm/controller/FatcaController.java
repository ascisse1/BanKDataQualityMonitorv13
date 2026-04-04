package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.ApiResponse;
import com.adakalgroup.bdqm.dto.FatcaClientDto;
import com.adakalgroup.bdqm.dto.FatcaStatsDto;
import com.adakalgroup.bdqm.model.FatcaAuditLog;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.FatcaStatus;
import com.adakalgroup.bdqm.config.FatcaConfig;
import com.adakalgroup.bdqm.security.StructureSecurityService;
import com.adakalgroup.bdqm.service.FatcaAuditService;
import com.adakalgroup.bdqm.service.FatcaScreeningService;
import com.adakalgroup.bdqm.service.FatcaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/fatca")
@RequiredArgsConstructor
public class FatcaController {

    private final FatcaService fatcaService;
    private final FatcaAuditService fatcaAuditService;
    private final FatcaScreeningService fatcaScreeningService;
    private final FatcaConfig fatcaConfig;
    private final StructureSecurityService structureSecurityService;

    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<FatcaClientDto>>> getFatcaClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<FatcaClientDto> clients = fatcaService.getFatcaClients(page, size);

        return ResponseEntity.ok(ApiResponse.success(clients));
    }

    @GetMapping("/corporate")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<FatcaClientDto>>> getCorporateFatcaClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<FatcaClientDto> clients = fatcaService.getFatcaClientsByType(
            ClientType.CORPORATE, page, size);

        return ResponseEntity.ok(ApiResponse.success(clients));
    }

    @GetMapping("/by-status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<FatcaClientDto>>> getFatcaClientsByStatus(
            @PathVariable FatcaStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        Page<FatcaClientDto> clients = fatcaService.getFatcaClientsByStatus(status, page, size);

        return ResponseEntity.ok(ApiResponse.success(clients));
    }

    @GetMapping("/by-agency/{structureCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<Page<FatcaClientDto>>> getFatcaClientsByAgency(
            @PathVariable String structureCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        structureSecurityService.requireAgencyAccess(structureCode);
        Page<FatcaClientDto> clients = fatcaService.getFatcaClientsByAgency(structureCode, page, size);

        return ResponseEntity.ok(ApiResponse.success(clients));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<FatcaStatsDto>> getFatcaStats() {
        FatcaStatsDto stats = fatcaService.getFatcaStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/stats/by-agency")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFatcaStatsByAgency() {
        List<Map<String, Object>> stats = fatcaService.getFatcaStatsByAgency();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/indicators")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getFatcaIndicators() {
        Map<String, Long> indicators = fatcaService.getFatcaIndicators();
        return ResponseEntity.ok(ApiResponse.success(indicators));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FatcaClientDto>> createFatcaClient(@RequestBody FatcaClientDto dto) {
        FatcaClientDto created = fatcaService.createFatcaClient(dto);
        return ResponseEntity.ok(ApiResponse.success("Client FATCA créé avec succès", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<FatcaClientDto>> updateFatcaClient(
            @PathVariable Long id,
            @RequestBody FatcaClientDto dto) {

        FatcaClientDto updated = fatcaService.updateFatcaClient(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Client FATCA mis à jour avec succès", updated));
    }

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFatcaConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("giin", fatcaConfig.getGiin());
        config.put("reportingCountry", fatcaConfig.getReportingCountry());
        config.put("fiName", fatcaConfig.getFiName());
        config.put("fiAddress", fatcaConfig.getFiAddress());
        config.put("filerCategory", fatcaConfig.getFilerCategory());
        config.put("screeningEnabled", fatcaConfig.isScreeningEnabled());
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @GetMapping("/audit/{cli}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<FatcaAuditLog>>> getAuditHistory(
            @PathVariable String cli,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<FatcaAuditLog> audit = fatcaAuditService.getAuditHistory(cli, page, size);
        return ResponseEntity.ok(ApiResponse.success(audit));
    }

    @PostMapping("/screen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerScreening() {
        log.info("Manual FATCA screening triggered via API");
        FatcaScreeningService.ScreeningResult result = fatcaScreeningService.screenAllClients();

        Map<String, Object> response = new HashMap<>();
        response.put("totalScanned", result.totalScanned());
        response.put("newDetections", result.newDetections());
        response.put("updated", result.updated());
        response.put("errors", result.errors());
        response.put("timestamp", System.currentTimeMillis());

        String message = String.format("Screening terminé: %d clients analysés, %d nouvelles détections, %d mis à jour",
            result.totalScanned(), result.newDetections(), result.updated());
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
