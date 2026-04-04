package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.ApiResponse;
import com.adakalgroup.dataqualitybackend.dto.ValidationRuleDto;
import com.adakalgroup.dataqualitybackend.model.enums.ClientType;
import com.adakalgroup.dataqualitybackend.service.ValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/validation")
@RequiredArgsConstructor
public class ValidationController {

    private final ValidationService validationService;

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<ValidationRuleDto>>> getAllRules() {
        List<ValidationRuleDto> rules = validationService.getAllRules();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/rules/active")
    public ResponseEntity<ApiResponse<List<ValidationRuleDto>>> getActiveRules() {
        List<ValidationRuleDto> rules = validationService.getActiveRules();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/rules/by-type/{clientType}")
    public ResponseEntity<ApiResponse<List<ValidationRuleDto>>> getRulesByClientType(
            @PathVariable ClientType clientType) {

        List<ValidationRuleDto> rules = validationService.getRulesByClientType(clientType);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/rules/by-field/{fieldName}")
    public ResponseEntity<ApiResponse<List<ValidationRuleDto>>> getRulesByField(
            @PathVariable String fieldName) {

        List<ValidationRuleDto> rules = validationService.getRulesByField(fieldName);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ValidationRuleDto>> createRule(@RequestBody ValidationRuleDto dto) {
        ValidationRuleDto created = validationService.createRule(dto);
        return ResponseEntity.ok(ApiResponse.success("Règle de validation créée avec succès", created));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ValidationRuleDto>> updateRule(
            @PathVariable Long id,
            @RequestBody ValidationRuleDto dto) {

        ValidationRuleDto updated = validationService.updateRule(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Règle de validation mise à jour avec succès", updated));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        validationService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.success("Règle de validation supprimée avec succès", null));
    }

    @PatchMapping("/rules/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleRule(
            @PathVariable Long id,
            @RequestParam boolean active) {

        validationService.toggleRule(id, active);
        return ResponseEntity.ok(ApiResponse.success("Règle de validation modifiée avec succès", null));
    }

    @PostMapping("/rules/bulk-toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> bulkToggle(@RequestBody BulkToggleRequest request) {
        validationService.bulkToggle(request.ids(), request.active());
        return ResponseEntity.ok(ApiResponse.success(
            String.format("%d règle(s) %s avec succès",
                request.ids().size(),
                request.active() ? "activée(s)" : "désactivée(s)"),
            null));
    }

    @PostMapping("/rules/bulk-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody BulkDeleteRequest request) {
        validationService.bulkDelete(request.ids());
        return ResponseEntity.ok(ApiResponse.success(
            String.format("%d règle(s) supprimée(s) avec succès", request.ids().size()),
            null));
    }

    @PutMapping("/rules/priorities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updatePriorities(
            @RequestBody List<ValidationService.PriorityUpdate> priorities) {
        validationService.updatePriorities(priorities);
        return ResponseEntity.ok(ApiResponse.success("Priorités mises à jour avec succès", null));
    }

    public record BulkToggleRequest(List<Long> ids, boolean active) {}
    public record BulkDeleteRequest(List<Long> ids) {}
}
