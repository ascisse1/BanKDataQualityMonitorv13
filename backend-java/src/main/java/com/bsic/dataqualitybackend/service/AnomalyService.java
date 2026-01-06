package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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

    @Cacheable(value = "anomalies", key = "#clientType + '_' + #page + '_' + #size")
    public Page<AnomalyDto> getAnomaliesByClientType(ClientType clientType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return anomalyRepository.findByClientType(clientType, pageable)
            .map(this::mapToDto);
    }

    public Page<AnomalyDto> getAnomaliesByClientType(ClientType clientType, Pageable pageable) {
        return anomalyRepository.findByClientType(clientType, pageable)
            .map(this::mapToDto);
    }

    public Page<AnomalyDto> getAnomaliesByAgency(String agencyCode, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return anomalyRepository.findByAgencyCode(agencyCode, pageable)
            .map(this::mapToDto);
    }

    public Page<AnomalyDto> getAnomaliesByStatus(AnomalyStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return anomalyRepository.findByStatus(status, pageable)
            .map(this::mapToDto);
    }

    public Page<AnomalyDto> getAnomaliesByStatus(AnomalyStatus status, Pageable pageable) {
        return anomalyRepository.findByStatus(status, pageable)
            .map(this::mapToDto);
    }

    public AnomalyDto getAnomalyById(Long id) {
        return anomalyRepository.findById(id)
            .map(this::mapToDto)
            .orElseThrow(() -> new RuntimeException("Anomaly not found with id: " + id));
    }

    public List<AnomalyDto> getAnomaliesByAgencyCode(String agencyCode) {
        return anomalyRepository.findByAgencyCode(agencyCode)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public long countAnomaliesByStatus(AnomalyStatus status) {
        return anomalyRepository.countByStatus(status);
    }

    public List<AnomalyDto> getRecentAnomalies(int limit) {
        return anomalyRepository.findTop10ByOrderByCreatedAtDesc()
            .stream()
            .limit(limit)
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public Map<String, Long> getAnomalyCountsByClientType() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("INDIVIDUAL", anomalyRepository.countByClientType(ClientType.INDIVIDUAL));
        counts.put("CORPORATE", anomalyRepository.countByClientType(ClientType.CORPORATE));
        counts.put("INSTITUTIONAL", anomalyRepository.countByClientType(ClientType.INSTITUTIONAL));
        return counts;
    }

    public Map<String, Long> getAnomalyCountsByStatus() {
        Map<String, Long> counts = new HashMap<>();
        for (AnomalyStatus status : AnomalyStatus.values()) {
            counts.put(status.name(), anomalyRepository.countByStatus(status));
        }
        return counts;
    }

    public List<Map<String, Object>> getAnomaliesByBranch(ClientType clientType) {
        List<Object[]> results = anomalyRepository.countByAgencyAndClientType(clientType);
        return results.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("agencyCode", row[0]);
                map.put("agencyName", row[1]);
                map.put("count", row[2]);
                return map;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTopAnomalyFields(ClientType clientType, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> results = anomalyRepository.countByFieldNameAndClientType(clientType, pageable);
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
        List<Object[]> results = anomalyRepository.countByCreatedAtAfterGroupByDate(startDate);
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
        Anomaly anomaly = mapToEntity(anomalyDto);
        Anomaly saved = anomalyRepository.save(anomaly);
        log.info("Created anomaly with ID: {}", saved.getId());
        return mapToDto(saved);
    }

    @Transactional
    @CacheEvict(value = "anomalies", allEntries = true)
    public AnomalyDto updateAnomaly(Long id, AnomalyDto anomalyDto) {
        Anomaly anomaly = anomalyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Anomaly not found with id: " + id));

        anomaly.setCorrectionValue(anomalyDto.getCorrectionValue());
        anomaly.setStatus(anomalyDto.getStatus());
        anomaly.setValidationComment(anomalyDto.getValidationComment());

        Anomaly updated = anomalyRepository.save(anomaly);
        log.info("Updated anomaly with ID: {}", updated.getId());
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
