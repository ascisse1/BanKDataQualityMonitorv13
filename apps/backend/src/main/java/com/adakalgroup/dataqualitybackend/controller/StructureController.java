package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.ApiResponse;
import com.adakalgroup.dataqualitybackend.model.Structure;
import com.adakalgroup.dataqualitybackend.security.StructureSecurityService;
import com.adakalgroup.dataqualitybackend.service.StructureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/structures")
@RequiredArgsConstructor
public class StructureController {

    private final StructureService structureService;
    private final StructureSecurityService structureSecurityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAllAgencies() {
        List<String> filter = structureSecurityService.getAgencyFilter();
        List<Structure> agencies = structureService.getAllAgencies();
        List<Map<String, String>> result = filterAndMap(agencies, filter);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/ordered")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAgenciesOrdered() {
        List<String> filter = structureSecurityService.getAgencyFilter();
        List<Structure> agencies = structureService.getAgenciesOrderedByName();
        List<Map<String, String>> result = filterAndMap(agencies, filter);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getByCode(@PathVariable String code) {
        structureSecurityService.requireAgencyAccess(code);
        Structure s = structureService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success(toMap(s)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> create(@RequestBody Map<String, String> body) {
        Structure created = structureService.createAgency(body.get("code"), body.get("name"));
        return ResponseEntity.ok(ApiResponse.success("Structure creee avec succes", toMap(created)));
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> update(
            @PathVariable String code, @RequestBody Map<String, String> body) {
        Structure updated = structureService.updateAgency(code, body.get("name"));
        return ResponseEntity.ok(ApiResponse.success("Structure mise a jour avec succes", toMap(updated)));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        structureService.deleteAgency(code);
        return ResponseEntity.ok(ApiResponse.success("Structure supprimee avec succes", null));
    }

    private List<Map<String, String>> filterAndMap(List<Structure> agencies, List<String> filter) {
        return agencies.stream()
                .filter(s -> filter.isEmpty() || filter.contains(s.getCode()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    private Map<String, String> toMap(Structure s) {
        return Map.of(
                "code", s.getCode() != null ? s.getCode() : "",
                "name", s.getName() != null ? s.getName() : "");
    }
}
