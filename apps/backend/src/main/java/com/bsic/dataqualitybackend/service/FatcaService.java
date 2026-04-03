package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.FatcaClientDto;
import com.bsic.dataqualitybackend.dto.FatcaStatsDto;
import com.bsic.dataqualitybackend.model.FatcaClient;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.FatcaStatus;
import com.bsic.dataqualitybackend.repository.FatcaClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FatcaService {

    private final FatcaClientRepository fatcaClientRepository;
    private final FatcaAuditService fatcaAuditService;

    public Page<FatcaClientDto> getFatcaClients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fatcaClientRepository.findAll(pageable)
            .map(this::mapToDto);
    }

    public Page<FatcaClientDto> getFatcaClientsByType(ClientType clientType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fatcaClientRepository.findByClientType(clientType, pageable)
            .map(this::mapToDto);
    }

    public Page<FatcaClientDto> getFatcaClientsByStatus(FatcaStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fatcaClientRepository.findByFatcaStatus(status, pageable)
            .map(this::mapToDto);
    }

    public Page<FatcaClientDto> getFatcaClientsByAgency(String structureCode, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return fatcaClientRepository.findByStructureCode(structureCode, pageable)
            .map(this::mapToDto);
    }

    public FatcaStatsDto getFatcaStats() {
        long totalClients = fatcaClientRepository.count();
        long compliantClients = fatcaClientRepository.countByFatcaStatus(FatcaStatus.COMPLIANT);
        long nonCompliantClients = fatcaClientRepository.countByFatcaStatus(FatcaStatus.NON_COMPLIANT);
        long pendingReview = fatcaClientRepository.countByFatcaStatus(FatcaStatus.PENDING_REVIEW);
        long underInvestigation = fatcaClientRepository.countByFatcaStatus(FatcaStatus.UNDER_INVESTIGATION);
        long usPersons = fatcaClientRepository.countByUsPerson(true);
        long reportingRequired = fatcaClientRepository.countByReportingRequired(true);

        double complianceRate = totalClients > 0
            ? (double) compliantClients / totalClients * 100
            : 0.0;

        Map<String, Long> clientsByStatus = new HashMap<>();
        List<Object[]> statusCounts = fatcaClientRepository.countByStatus();
        for (Object[] row : statusCounts) {
            clientsByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Long> clientsByRiskLevel = new HashMap<>();
        List<Object[]> riskCounts = fatcaClientRepository.countByRiskLevel();
        for (Object[] row : riskCounts) {
            clientsByRiskLevel.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        return FatcaStatsDto.builder()
            .totalClients(totalClients)
            .compliantClients(compliantClients)
            .nonCompliantClients(nonCompliantClients)
            .pendingReview(pendingReview)
            .underInvestigation(underInvestigation)
            .usPersons(usPersons)
            .reportingRequired(reportingRequired)
            .complianceRate(complianceRate)
            .clientsByStatus(clientsByStatus)
            .clientsByRiskLevel(clientsByRiskLevel)
            .build();
    }

    public List<Map<String, Object>> getFatcaStatsByAgency() {
        List<Object[]> results = fatcaClientRepository.getStatsByAgency();
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("structureCode", row[0]);
                map.put("structureName", row[1]);
                map.put("total", row[2]);
                map.put("compliant", row[3]);
                map.put("nonCompliant", row[4]);
                return map;
            })
            .collect(Collectors.toList());
    }

    public Map<String, Long> getFatcaIndicators() {
        Map<String, Long> indicators = new HashMap<>();
        indicators.put("compliant", fatcaClientRepository.countByFatcaStatus(FatcaStatus.COMPLIANT));
        indicators.put("nonCompliant", fatcaClientRepository.countByFatcaStatus(FatcaStatus.NON_COMPLIANT));
        indicators.put("pendingReview", fatcaClientRepository.countByFatcaStatus(FatcaStatus.PENDING_REVIEW));
        indicators.put("underInvestigation", fatcaClientRepository.countByFatcaStatus(FatcaStatus.UNDER_INVESTIGATION));
        indicators.put("usPerson", fatcaClientRepository.countByUsPerson(true));
        indicators.put("reportingRequired", fatcaClientRepository.countByReportingRequired(true));
        return indicators;
    }

    @Transactional
    public FatcaClientDto createFatcaClient(FatcaClientDto dto) {
        FatcaClient fatcaClient = mapToEntity(dto);
        FatcaClient saved = fatcaClientRepository.save(fatcaClient);
        log.info("Created FATCA client with ID: {}", saved.getId());
        fatcaAuditService.logStatusChange(
            saved.getClientNumber(), null,
            saved.getFatcaStatus() != null ? saved.getFatcaStatus().name() : null,
            "ADMIN", "Client FATCA créé");
        return mapToDto(saved);
    }

    @Transactional
    public FatcaClientDto updateFatcaClient(Long id, FatcaClientDto dto) {
        FatcaClient fatcaClient = fatcaClientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("FATCA client not found with id: " + id));

        String previousStatus = fatcaClient.getFatcaStatus() != null ? fatcaClient.getFatcaStatus().name() : null;

        fatcaClient.setFatcaStatus(dto.getFatcaStatus());
        fatcaClient.setRiskLevel(dto.getRiskLevel());
        fatcaClient.setNotes(dto.getNotes());
        fatcaClient.setLastReviewDate(dto.getLastReviewDate());
        fatcaClient.setNextReviewDate(dto.getNextReviewDate());

        FatcaClient updated = fatcaClientRepository.save(fatcaClient);
        log.info("Updated FATCA client with ID: {}", updated.getId());

        String newStatus = updated.getFatcaStatus() != null ? updated.getFatcaStatus().name() : null;
        if (previousStatus == null || !previousStatus.equals(newStatus)) {
            fatcaAuditService.logStatusChange(
                updated.getClientNumber(), previousStatus, newStatus,
                "USER", dto.getNotes());
        }

        return mapToDto(updated);
    }

    private FatcaClientDto mapToDto(FatcaClient fatcaClient) {
        return FatcaClientDto.builder()
            .id(fatcaClient.getId())
            .clientNumber(fatcaClient.getClientNumber())
            .clientName(fatcaClient.getClientName())
            .clientType(fatcaClient.getClientType())
            .structureCode(fatcaClient.getStructureCode())
            .structureName(fatcaClient.getStructureName())
            .fatcaStatus(fatcaClient.getFatcaStatus())
            .taxResidenceCountry(fatcaClient.getTaxResidenceCountry())
            .usPerson(fatcaClient.getUsPerson())
            .usTin(fatcaClient.getUsTin())
            .w9FormReceived(fatcaClient.getW9FormReceived())
            .w8FormReceived(fatcaClient.getW8FormReceived())
            .birthPlace(fatcaClient.getBirthPlace())
            .birthCountry(fatcaClient.getBirthCountry())
            .usAddress(fatcaClient.getUsAddress())
            .usPhone(fatcaClient.getUsPhone())
            .riskLevel(fatcaClient.getRiskLevel())
            .lastReviewDate(fatcaClient.getLastReviewDate())
            .nextReviewDate(fatcaClient.getNextReviewDate())
            .declarationDate(fatcaClient.getDeclarationDate())
            .notes(fatcaClient.getNotes())
            .reportingRequired(fatcaClient.getReportingRequired())
            .w9ReceivedDate(fatcaClient.getW9ReceivedDate())
            .w8ReceivedDate(fatcaClient.getW8ReceivedDate())
            .w9ExpiryDate(fatcaClient.getW9ExpiryDate())
            .w8ExpiryDate(fatcaClient.getW8ExpiryDate())
            .documentStatus(fatcaClient.getDocumentStatus())
            .documentNotes(fatcaClient.getDocumentNotes())
            .indiciaTypes(fatcaClient.getIndiciaTypes())
            .indiciaCount(fatcaClient.getIndiciaCount())
            .lastScreeningDate(fatcaClient.getLastScreeningDate())
            .detectionSource(fatcaClient.getDetectionSource())
            .createdAt(fatcaClient.getCreatedAt())
            .updatedAt(fatcaClient.getUpdatedAt())
            .build();
    }

    private FatcaClient mapToEntity(FatcaClientDto dto) {
        return FatcaClient.builder()
            .clientNumber(dto.getClientNumber())
            .clientName(dto.getClientName())
            .clientType(dto.getClientType())
            .structureCode(dto.getStructureCode())
            .structureName(dto.getStructureName())
            .fatcaStatus(dto.getFatcaStatus())
            .taxResidenceCountry(dto.getTaxResidenceCountry())
            .usPerson(dto.getUsPerson())
            .usTin(dto.getUsTin())
            .w9FormReceived(dto.getW9FormReceived())
            .w8FormReceived(dto.getW8FormReceived())
            .birthPlace(dto.getBirthPlace())
            .birthCountry(dto.getBirthCountry())
            .usAddress(dto.getUsAddress())
            .usPhone(dto.getUsPhone())
            .riskLevel(dto.getRiskLevel())
            .lastReviewDate(dto.getLastReviewDate())
            .nextReviewDate(dto.getNextReviewDate())
            .declarationDate(dto.getDeclarationDate())
            .notes(dto.getNotes())
            .reportingRequired(dto.getReportingRequired())
            .w9ReceivedDate(dto.getW9ReceivedDate())
            .w8ReceivedDate(dto.getW8ReceivedDate())
            .w9ExpiryDate(dto.getW9ExpiryDate())
            .w8ExpiryDate(dto.getW8ExpiryDate())
            .documentStatus(dto.getDocumentStatus())
            .documentNotes(dto.getDocumentNotes())
            .build();
    }
}
