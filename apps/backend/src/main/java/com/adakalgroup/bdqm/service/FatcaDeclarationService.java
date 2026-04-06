package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.FatcaDeclarationDto;
import com.adakalgroup.bdqm.dto.GenerateDeclarationRequest;
import com.adakalgroup.bdqm.dto.ValidateDeclarationRequest;
import com.adakalgroup.bdqm.model.FatcaDeclaration;
import com.adakalgroup.bdqm.model.enums.DeclarationStatus;
import com.adakalgroup.bdqm.model.enums.DeclarationType;
import com.adakalgroup.bdqm.repository.FatcaDeclarationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class FatcaDeclarationService {

    private final FatcaDeclarationRepository declarationRepository;
    private final FatcaXmlGeneratorService xmlGeneratorService;
    private final FatcaAuditService fatcaAuditService;

    @Transactional
    public FatcaDeclarationDto generateDeclaration(GenerateDeclarationRequest request, String username) {
        log.info("Generating FATCA declaration for year {} type {} by {}",
                request.getReportingYear(), request.getDeclarationType(), username);

        if (request.getDeclarationType() != DeclarationType.ORIGINAL && request.getCorrectedMessageRefId() == null) {
            throw new IllegalArgumentException("correctedMessageRefId is required for CORRECTED/VOID declarations");
        }

        var result = xmlGeneratorService.generateXml(
                request.getReportingYear(),
                request.getDeclarationType(),
                request.getCorrectedMessageRefId());

        String xmlHash = sha256(result.xml());

        FatcaDeclaration declaration = FatcaDeclaration.builder()
                .reportingYear(request.getReportingYear())
                .declarationType(request.getDeclarationType())
                .status(DeclarationStatus.DRAFT)
                .xmlContent(result.xml())
                .xmlHash(xmlHash)
                .generatedBy(username)
                .generatedAt(LocalDateTime.now())
                .messageRefId(result.messageRefId())
                .correctedMessageRefId(request.getCorrectedMessageRefId())
                .totalAccounts(result.totalAccounts())
                .notes(request.getNotes())
                .build();

        declaration = declarationRepository.save(declaration);
        log.info("Declaration generated: id={}, messageRefId={}, accounts={}",
                declaration.getId(), declaration.getMessageRefId(), declaration.getTotalAccounts());

        fatcaAuditService.logDeclarationEvent(declaration.getMessageRefId(),
                "DECL_GENERATED", username, "Generated with " + result.totalAccounts() + " accounts");

        return mapToDto(declaration);
    }

    public Page<FatcaDeclarationDto> getDeclarations(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return declarationRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    public FatcaDeclarationDto getDeclaration(Long id) {
        return mapToDto(findById(id));
    }

    public String getDeclarationXml(Long id) {
        FatcaDeclaration decl = findById(id);
        if (decl.getXmlContent() == null) {
            throw new IllegalStateException("Declaration has no XML content");
        }
        return decl.getXmlContent();
    }

    @Transactional
    public FatcaDeclarationDto validateDeclaration(Long id, ValidateDeclarationRequest request, String validatorUsername) {
        FatcaDeclaration decl = findById(id);

        if (decl.getStatus() != DeclarationStatus.DRAFT) {
            throw new IllegalStateException("Declaration must be in DRAFT status to validate, current: " + decl.getStatus());
        }

        // 4-Eyes: validator must differ from generator
        if (decl.getGeneratedBy().equals(validatorUsername)) {
            throw new IllegalStateException("4 Yeux: vous ne pouvez pas valider votre propre déclaration");
        }

        decl.setValidatedBy(validatorUsername);
        decl.setValidatedAt(LocalDateTime.now());
        decl.setValidationNotes(request.getNotes());

        if (request.isApproved()) {
            decl.setStatus(DeclarationStatus.VALIDATED);
            log.info("Declaration {} validated by {}", decl.getMessageRefId(), validatorUsername);
            fatcaAuditService.logDeclarationEvent(decl.getMessageRefId(),
                    "DECL_VALIDATED", validatorUsername, request.getNotes());
        } else {
            decl.setStatus(DeclarationStatus.REJECTED);
            log.info("Declaration {} rejected by {}: {}", decl.getMessageRefId(), validatorUsername, request.getNotes());
            fatcaAuditService.logDeclarationEvent(decl.getMessageRefId(),
                    "DECL_REJECTED", validatorUsername, request.getNotes());
        }

        return mapToDto(declarationRepository.save(decl));
    }

    @Transactional
    public FatcaDeclarationDto signDeclaration(Long id, String signerUsername) {
        FatcaDeclaration decl = findById(id);

        if (decl.getStatus() != DeclarationStatus.VALIDATED) {
            throw new IllegalStateException("Declaration must be VALIDATED to sign, current: " + decl.getStatus());
        }

        decl.setSignedBy(signerUsername);
        decl.setSignedAt(LocalDateTime.now());
        decl.setStatus(DeclarationStatus.SIGNED);

        log.info("Declaration {} signed by {}", decl.getMessageRefId(), signerUsername);
        fatcaAuditService.logDeclarationEvent(decl.getMessageRefId(), "DECL_SIGNED", signerUsername, null);

        return mapToDto(declarationRepository.save(decl));
    }

    @Transactional
    public FatcaDeclarationDto submitDeclaration(Long id, String submitterUsername) {
        FatcaDeclaration decl = findById(id);

        if (decl.getStatus() != DeclarationStatus.SIGNED) {
            throw new IllegalStateException("Declaration must be SIGNED to submit, current: " + decl.getStatus());
        }

        decl.setSubmittedAt(LocalDateTime.now());
        decl.setStatus(DeclarationStatus.SUBMITTED);

        log.info("Declaration {} submitted by {}", decl.getMessageRefId(), submitterUsername);
        fatcaAuditService.logDeclarationEvent(decl.getMessageRefId(), "DECL_SUBMITTED", submitterUsername, null);

        // TODO: Actual IDES SFTP/API transmission

        return mapToDto(declarationRepository.save(decl));
    }

    private FatcaDeclaration findById(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Declaration not found: " + id));
    }

    private FatcaDeclarationDto mapToDto(FatcaDeclaration d) {
        return FatcaDeclarationDto.builder()
                .id(d.getId())
                .reportingYear(d.getReportingYear())
                .declarationType(d.getDeclarationType())
                .status(d.getStatus())
                .generatedBy(d.getGeneratedBy())
                .generatedAt(d.getGeneratedAt())
                .validatedBy(d.getValidatedBy())
                .validatedAt(d.getValidatedAt())
                .validationNotes(d.getValidationNotes())
                .signedBy(d.getSignedBy())
                .signedAt(d.getSignedAt())
                .submittedAt(d.getSubmittedAt())
                .ackReceivedAt(d.getAckReceivedAt())
                .messageRefId(d.getMessageRefId())
                .correctedMessageRefId(d.getCorrectedMessageRefId())
                .totalAccounts(d.getTotalAccounts())
                .notes(d.getNotes())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.warn("Failed to compute SHA-256", e);
            return null;
        }
    }
}
