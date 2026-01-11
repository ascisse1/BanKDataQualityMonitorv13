package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.AgencyDto;
import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.service.AgencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgencyController {

    private final AgencyService agencyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<List<AgencyDto>>> getAllAgencies() {
        List<AgencyDto> agencies = agencyService.getAllAgencies();
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    @GetMapping("/ordered")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<List<AgencyDto>>> getAgenciesOrdered() {
        List<AgencyDto> agencies = agencyService.getAgenciesOrderedByName();
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    @GetMapping("/{age}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'AGENCY_USER')")
    public ResponseEntity<ApiResponse<AgencyDto>> getAgencyByCode(@PathVariable String age) {
        AgencyDto agency = agencyService.getAgencyByCode(age);
        return ResponseEntity.ok(ApiResponse.success(agency));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgencyDto>> createAgency(@RequestBody AgencyDto dto) {
        AgencyDto created = agencyService.createAgency(dto);
        return ResponseEntity.ok(ApiResponse.success("Agence créée avec succès", created));
    }

    @PutMapping("/{age}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgencyDto>> updateAgency(
            @PathVariable String age,
            @RequestBody AgencyDto dto) {

        AgencyDto updated = agencyService.updateAgency(age, dto);
        return ResponseEntity.ok(ApiResponse.success("Agence mise à jour avec succès", updated));
    }

    @DeleteMapping("/{age}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAgency(@PathVariable String age) {
        agencyService.deleteAgency(age);
        return ResponseEntity.ok(ApiResponse.success("Agence supprimée avec succès", null));
    }
}
