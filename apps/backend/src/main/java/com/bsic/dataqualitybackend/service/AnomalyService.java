package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.config.metrics.BusinessMetricsConfig;
import com.bsic.dataqualitybackend.security.StructureSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyService {

    private final AnomalyRepository anomalyRepository;
    private final BusinessMetricsConfig metricsConfig;
    private final AnomalyWorkflowService anomalyWorkflowService;
    private final StructureSecurityService structureSecurityService;

    // Note: @Cacheable removed - Page objects don't serialize properly with Spring Cache
    // and cause ClassCastException (LinkedHashMap cannot be cast to Page)
    public Page<AnomalyDto> getAnomaliesByClientType(ClientType clientType, int page, int size) {
        log.debug("Fetching anomalies for clientType={}, page={}, size={}", clientType, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<String> agencies = structureSecurityService.getAgencyFilter();

        if (clientType == null) {
            if (agencies.isEmpty()) {
                return anomalyRepository.findAll(pageable).map(this::mapToDto);
            } else if (agencies.size() == 1) {
                return anomalyRepository.findByAgencyCode(agencies.get(0), pageable).map(this::mapToDto);
            } else {
                return anomalyRepository.findByAgencyCodeIn(agencies, pageable).map(this::mapToDto);
            }
        }

        if (agencies.isEmpty()) {
            return anomalyRepository.findByClientType(clientType, pageable).map(this::mapToDto);
        } else if (agencies.size() == 1) {
            return anomalyRepository.findByClientTypeAndAgencyCode(clientType, agencies.get(0), pageable).map(this::mapToDto);
        } else {
            return anomalyRepository.findByClientTypeAndAgencyCodeIn(clientType, agencies, pageable).map(this::mapToDto);
        }
    }

    public Page<AnomalyDto> getAnomaliesByClientType(ClientType clientType, Pageable pageable) {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        if (agencies.isEmpty()) {
            return anomalyRepository.findByClientType(clientType, pageable).map(this::mapToDto);
        } else if (agencies.size() == 1) {
            return anomalyRepository.findByClientTypeAndAgencyCode(clientType, agencies.get(0), pageable).map(this::mapToDto);
        } else {
            return anomalyRepository.findByClientTypeAndAgencyCodeIn(clientType, agencies, pageable).map(this::mapToDto);
        }
    }

    public Page<AnomalyDto> getAnomaliesByAgency(String agencyCode, int page, int size) {
        structureSecurityService.requireAgencyAccess(agencyCode);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return anomalyRepository.findByAgencyCode(agencyCode, pageable)
            .map(this::mapToDto);
    }

    public Page<AnomalyDto> getAnomaliesByStatus(AnomalyStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<String> agencies = structureSecurityService.getAgencyFilter();
        if (agencies.isEmpty()) {
            return anomalyRepository.findByStatus(status, pageable).map(this::mapToDto);
        } else if (agencies.size() == 1) {
            return anomalyRepository.findByStatusAndAgencyCodeIn(status, agencies, pageable).map(this::mapToDto);
        } else {
            return anomalyRepository.findByStatusAndAgencyCodeIn(status, agencies, pageable).map(this::mapToDto);
        }
    }

    public Page<AnomalyDto> getAnomaliesByStatus(AnomalyStatus status, Pageable pageable) {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        if (agencies.isEmpty()) {
            return anomalyRepository.findByStatus(status, pageable).map(this::mapToDto);
        } else {
            return anomalyRepository.findByStatusAndAgencyCodeIn(status, agencies, pageable).map(this::mapToDto);
        }
    }

    public AnomalyDto getAnomalyById(Long id) {
        Anomaly anomaly = anomalyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Anomaly not found with id: " + id));
        structureSecurityService.requireAgencyAccess(anomaly.getAgencyCode());
        return mapToDto(anomaly);
    }

    public List<AnomalyDto> getAnomaliesByAgencyCode(String agencyCode) {
        structureSecurityService.requireAgencyAccess(agencyCode);
        return anomalyRepository.findByAgencyCode(agencyCode)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public long countAnomaliesByStatus(AnomalyStatus status) {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        if (agencies.isEmpty()) {
            return anomalyRepository.countByStatus(status);
        }
        return anomalyRepository.countByStatusAndAgencyCodeIn(status, agencies);
    }

    public List<AnomalyDto> getRecentAnomalies(int limit) {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        if (agencies.isEmpty()) {
            return anomalyRepository.findTop10ByOrderByCreatedAtDesc()
                .stream().limit(limit).map(this::mapToDto).collect(Collectors.toList());
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        return anomalyRepository.findByAgencyCodeIn(agencies, pageable)
            .getContent().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public Map<String, Long> getAnomalyCountsByClientType() {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        Map<String, Long> counts = new HashMap<>();
        if (agencies.isEmpty()) {
            counts.put("INDIVIDUAL", anomalyRepository.countByClientType(ClientType.INDIVIDUAL));
            counts.put("CORPORATE", anomalyRepository.countByClientType(ClientType.CORPORATE));
            counts.put("INSTITUTIONAL", anomalyRepository.countByClientType(ClientType.INSTITUTIONAL));
        } else {
            counts.put("INDIVIDUAL", anomalyRepository.countByClientTypeAndAgencyCodeIn(ClientType.INDIVIDUAL, agencies));
            counts.put("CORPORATE", anomalyRepository.countByClientTypeAndAgencyCodeIn(ClientType.CORPORATE, agencies));
            counts.put("INSTITUTIONAL", anomalyRepository.countByClientTypeAndAgencyCodeIn(ClientType.INSTITUTIONAL, agencies));
        }
        return counts;
    }

    public Map<String, Long> getAnomalyCountsByStatus() {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        Map<String, Long> counts = new HashMap<>();
        if (agencies.isEmpty()) {
            for (AnomalyStatus status : AnomalyStatus.values()) {
                counts.put(status.name(), anomalyRepository.countByStatus(status));
            }
        } else {
            for (AnomalyStatus status : AnomalyStatus.values()) {
                counts.put(status.name(), anomalyRepository.countByStatusAndAgencyCodeIn(status, agencies));
            }
        }
        return counts;
    }

    public List<Map<String, Object>> getAnomaliesByBranch(ClientType clientType) {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        List<Object[]> results = agencies.isEmpty()
            ? anomalyRepository.countByAgencyAndClientType(clientType)
            : anomalyRepository.countByAgencyAndClientTypeFiltered(clientType, agencies);
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("code_agence", row[0]);
                map.put("lib_agence", row[1]);
                map.put("nombre_anomalies", row[2]);
                return map;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAnomaliesByBranchAll() {
        List<String> agencies = structureSecurityService.getAgencyFilter();
        List<Object[]> results = agencies.isEmpty()
            ? anomalyRepository.countByAgencyGrouped()
            : anomalyRepository.countByAgencyGroupedFiltered(agencies);
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("code_agence", row[0]);
                map.put("lib_agence", row[1]);
                map.put("nombre_anomalies", row[2]);
                return map;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTopAnomalyFields(ClientType clientType, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<String> agencies = structureSecurityService.getAgencyFilter();
        List<Object[]> results = agencies.isEmpty()
            ? anomalyRepository.countByFieldNameAndClientType(clientType, pageable)
            : anomalyRepository.countByFieldNameAndClientTypeFiltered(clientType, agencies, pageable);
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("fieldName", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAnomalyTrends(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<String> agencies = structureSecurityService.getAgencyFilter();
        List<Object[]> results = agencies.isEmpty()
            ? anomalyRepository.countByCreatedAtAfterGroupByDate(startDate)
            : anomalyRepository.countByCreatedAtAfterGroupByDateFiltered(startDate, agencies);
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("date", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "anomalies", allEntries = true)
    public AnomalyDto createAnomaly(AnomalyDto anomalyDto) {
        return createAnomaly(anomalyDto, "SYSTEM", true);
    }

    @Transactional
    @CacheEvict(value = "anomalies", allEntries = true)
    public AnomalyDto createAnomaly(AnomalyDto anomalyDto, String initiatorUsername, boolean startWorkflow) {
        Anomaly anomaly = mapToEntity(anomalyDto);
        Anomaly saved = anomalyRepository.save(anomaly);
        log.info("Created anomaly with ID: {}", saved.getId());
        metricsConfig.recordAnomalyCreated();

        // Start BPMN workflow to create ticket and process anomaly
        if (startWorkflow) {
            try {
                String processInstanceId = anomalyWorkflowService.startWorkflowForAnomaly(saved, initiatorUsername);
                log.info("Workflow started for anomaly {} - processInstanceId: {}", saved.getId(), processInstanceId);
            } catch (Exception e) {
                log.warn("Failed to start workflow for anomaly {}: {}",
                        saved.getId(), e.getMessage());
                // Continue without workflow - anomaly is still created
            }
        }

        return mapToDto(saved);
    }

    @Transactional
    @CacheEvict(value = "anomalies", allEntries = true)
    public AnomalyDto updateAnomaly(Long id, AnomalyDto anomalyDto) {
        Anomaly anomaly = anomalyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Anomaly not found with id: " + id));
        structureSecurityService.requireAgencyAccess(anomaly.getAgencyCode());

        AnomalyStatus previousStatus = anomaly.getStatus();
        anomaly.setCorrectionValue(anomalyDto.getCorrectionValue());
        anomaly.setStatus(anomalyDto.getStatus());
        anomaly.setValidationComment(anomalyDto.getValidationComment());

        Anomaly updated = anomalyRepository.save(anomaly);
        log.info("Updated anomaly with ID: {}", updated.getId());

        // Record metric if anomaly was resolved
        if (anomalyDto.getStatus() != null &&
            (anomalyDto.getStatus() == AnomalyStatus.VALIDATED || anomalyDto.getStatus() == AnomalyStatus.CLOSED) &&
            previousStatus != AnomalyStatus.VALIDATED && previousStatus != AnomalyStatus.CLOSED) {
            metricsConfig.recordAnomalyResolved();
        }
        return mapToDto(updated);
    }

    @Transactional
    @CacheEvict(value = "anomalies", allEntries = true)
    public void deleteAnomaly(Long id) {
        anomalyRepository.deleteById(id);
        log.info("Deleted anomaly with ID: {}", id);
    }

    private AnomalyDto mapToDto(Anomaly anomaly) {
        return AnomalyDto.builder()
            .id(anomaly.getId())
            .clientNumber(anomaly.getClientNumber())
            .clientName(anomaly.getClientName())
            .clientType(anomaly.getClientType())
            .agencyCode(anomaly.getAgencyCode())
            .agencyName(anomaly.getAgencyName())
            .fieldName(anomaly.getFieldName())
            .fieldLabel(anomaly.getFieldLabel())
            .currentValue(anomaly.getCurrentValue())
            .expectedValue(anomaly.getExpectedValue())
            .errorType(anomaly.getErrorType())
            .errorMessage(anomaly.getErrorMessage())
            .status(anomaly.getStatus())
            .correctionValue(anomaly.getCorrectionValue())
            .correctedBy(anomaly.getCorrectedBy())
            .correctedAt(anomaly.getCorrectedAt())
            .validationComment(anomaly.getValidationComment())
            .validatedBy(anomaly.getValidatedBy())
            .validatedAt(anomaly.getValidatedAt())
            .ticketId(anomaly.getTicketId())
            .severity(anomaly.getSeverity())
            .dataSource(anomaly.getDataSource())
            .createdAt(anomaly.getCreatedAt())
            .updatedAt(anomaly.getUpdatedAt())
            .build();
    }

    private Anomaly mapToEntity(AnomalyDto dto) {
        return Anomaly.builder()
            .clientNumber(dto.getClientNumber())
            .clientName(dto.getClientName())
            .clientType(dto.getClientType())
            .agencyCode(dto.getAgencyCode())
            .agencyName(dto.getAgencyName())
            .fieldName(dto.getFieldName())
            .fieldLabel(dto.getFieldLabel())
            .currentValue(dto.getCurrentValue())
            .expectedValue(dto.getExpectedValue())
            .errorType(dto.getErrorType())
            .errorMessage(dto.getErrorMessage())
            .status(dto.getStatus() != null ? dto.getStatus() : AnomalyStatus.PENDING)
            .severity(dto.getSeverity())
            .dataSource(dto.getDataSource())
            .build();
    }
}
