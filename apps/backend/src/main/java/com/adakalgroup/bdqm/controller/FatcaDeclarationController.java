package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.ApiResponse;
import com.adakalgroup.bdqm.dto.FatcaDeclarationDto;
import com.adakalgroup.bdqm.dto.GenerateDeclarationRequest;
import com.adakalgroup.bdqm.dto.ValidateDeclarationRequest;
import com.adakalgroup.bdqm.security.SecurityUtils;
import com.adakalgroup.bdqm.service.FatcaDeclarationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/fatca/declarations")
@RequiredArgsConstructor
public class FatcaDeclarationController {

    private final FatcaDeclarationService declarationService;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FatcaDeclarationDto>> generate(
            @Valid @RequestBody GenerateDeclarationRequest request) {

        String username = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));

        FatcaDeclarationDto result = declarationService.generateDeclaration(request, username);
        return ResponseEntity.ok(ApiResponse.success("Déclaration FATCA générée avec succès", result));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<FatcaDeclarationDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<FatcaDeclarationDto> declarations = declarationService.getDeclarations(page, size);
        return ResponseEntity.ok(ApiResponse.success(declarations));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<FatcaDeclarationDto>> get(@PathVariable Long id) {
        FatcaDeclarationDto declaration = declarationService.getDeclaration(id);
        return ResponseEntity.ok(ApiResponse.success(declaration));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        FatcaDeclarationDto decl = declarationService.getDeclaration(id);
        String xml = declarationService.getDeclarationXml(id);

        String filename = String.format("FATCA_%d_%s.xml", decl.getReportingYear(), decl.getMessageRefId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<FatcaDeclarationDto>> validate(
            @PathVariable Long id,
            @RequestBody ValidateDeclarationRequest request) {

        String username = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));

        FatcaDeclarationDto result = declarationService.validateDeclaration(id, request, username);
        return ResponseEntity.ok(ApiResponse.success(
                request.isApproved() ? "Déclaration validée" : "Déclaration rejetée", result));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FatcaDeclarationDto>> sign(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));

        FatcaDeclarationDto result = declarationService.signDeclaration(id, username);
        return ResponseEntity.ok(ApiResponse.success("Déclaration signée", result));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FatcaDeclarationDto>> submit(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));

        FatcaDeclarationDto result = declarationService.submitDeclaration(id, username);
        return ResponseEntity.ok(ApiResponse.success("Déclaration soumise à l'IRS", result));
    }
}
