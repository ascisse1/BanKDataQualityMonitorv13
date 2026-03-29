package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.AgencyDto;
import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.security.StructureSecurityService;
import com.bsic.dataqualitybackend.service.AgencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
public class AgencyController {

    private final AgencyService agencyService;
    private final StructureSecurityService structureSecurityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AgencyDto>>> getAllAgencies() {
        List<String> filter = structureSecurityService.getAgencyFilter();
        List<AgencyDto> agencies = agencyService.getAllAgencies();
        if (!filter.isEmpty()) {
            agencies = agencies.stream()
                .filter(a -> filter.contains(a.getAge()))
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    @GetMapping("/ordered")
    public ResponseEntity<ApiResponse<List<AgencyDto>>> getAgenciesOrdered() {
        List<String> filter = structureSecurityService.getAgencyFilter();
        List<AgencyDto> agencies = agencyService.getAgenciesOrderedByName();
        if (!filter.isEmpty()) {
            agencies = agencies.stream()
                .filter(a -> filter.contains(a.getAge()))
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    @GetMapping("/{age}")
    public ResponseEntity<ApiResponse<AgencyDto>> getAgencyByCode(@PathVariable String age) {
        structureSecurityService.requireAgencyAccess(age);
        AgencyDto agency = agencyService.getAgencyByCode(age);
        return ResponseEntity.ok(ApiResponse.success(agency));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgencyDto>> createAgency(@RequestBody AgencyDto dto) {
        AgencyDto created = agencyService.createAgency(dto);
        return ResponseEntity.ok(ApiResponse.success("Agence creee avec succes", created));
    }

    @PutMapping("/{age}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgencyDto>> updateAgency(
            @PathVariable String age,
            @RequestBody AgencyDto dto) {
        AgencyDto updated = agencyService.updateAgency(age, dto);
        return ResponseEntity.ok(ApiResponse.success("Agence mise a jour avec succes", updated));
    }

    @DeleteMapping("/{age}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAgency(@PathVariable String age) {
        agencyService.deleteAgency(age);
        return ResponseEntity.ok(ApiResponse.success("Agence supprimee avec succes", null));
    }
}
