package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.dto.BranchAnomalyDto;
import com.bsic.dataqualitybackend.dto.DashboardStatsDto;
import com.bsic.dataqualitybackend.dto.ValidationMetricDto;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.ClientRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for dashboard statistics and metrics.
 * Tenant filtering is handled automatically by Hibernate @Filter.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatsService {

    private final AnomalyRepository anomalyRepository;
    private final TicketRepository ticketRepository;
    private final ClientRepository clientRepository;

    public DashboardStatsDto getClientStats() {
        log.info("Calculating client statistics for dashboard");

        long totalClients = clientRepository.count();
        long individualClients = clientRepository.countByTcli("1");
        long corporateClients = clientRepository.countByTcli("2");
        long institutionalClients = clientRepository.countByTcli("3");

        long totalAnomalies = anomalyRepository.count();
        long correctedAnomalies = anomalyRepository.countByStatus(AnomalyStatus.CORRECTED);

        long fatcaCount = 0;

        long pendingTickets = ticketRepository.countByStatus(TicketStatus.DETECTED) +
                              ticketRepository.countByStatus(TicketStatus.ASSIGNED) +
                              ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long resolvedTickets = ticketRepository.countByStatus(TicketStatus.CLOSED);

        double correctionRate = totalAnomalies > 0 ?
                (double) correctedAnomalies / totalAnomalies * 100 : 0;

        return DashboardStatsDto.builder()
                .total(totalClients)
                .individual(individualClients)
                .corporate(corporateClients)
                .institutional(institutionalClients)
                .anomalies(totalAnomalies)
                .fatca(fatcaCount)
                .pendingTickets(pendingTickets)
                .resolvedTickets(resolvedTickets)
                .correctionRate(Math.round(correctionRate * 100.0) / 100.0)
                .build();
    }

    public List<BranchAnomalyDto> getAnomaliesByBranch() {
        log.info("Getting anomalies grouped by branch");
        List<Object[]> results = anomalyRepository.countByAgencyGrouped();
        return results.stream()
                .map(row -> BranchAnomalyDto.builder()
                        .code_agence((String) row[0])
                        .lib_agence((String) row[1])
                        .nombre_anomalies(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ValidationMetricDto> getValidationMetrics() {
        log.info("Calculating validation metrics");

        List<ValidationMetricDto> metrics = new ArrayList<>();

        long individualTotal = clientRepository.countByTcli("1");
        long individualAnomalies = anomalyRepository.countByClientType(ClientType.INDIVIDUAL);
        long individualValid = individualTotal - individualAnomalies;
        double individualScore = individualTotal > 0 ? (double) individualValid / individualTotal * 100 : 100;

        metrics.add(ValidationMetricDto.builder()
                .category("Particuliers")
                .total_records(individualTotal)
                .valid_records(individualValid)
                .quality_score(Math.round(individualScore * 100.0) / 100.0)
                .build());

        long corporateTotal = clientRepository.countByTcli("2");
        long corporateAnomalies = anomalyRepository.countByClientType(ClientType.CORPORATE);
        long corporateValid = corporateTotal - corporateAnomalies;
        double corporateScore = corporateTotal > 0 ? (double) corporateValid / corporateTotal * 100 : 100;

        metrics.add(ValidationMetricDto.builder()
                .category("Entreprises")
                .total_records(corporateTotal)
                .valid_records(corporateValid)
                .quality_score(Math.round(corporateScore * 100.0) / 100.0)
                .build());

        long institutionalTotal = clientRepository.countByTcli("3");
        long institutionalAnomalies = anomalyRepository.countByClientType(ClientType.INSTITUTIONAL);
        long institutionalValid = institutionalTotal - institutionalAnomalies;
        double institutionalScore = institutionalTotal > 0 ? (double) institutionalValid / institutionalTotal * 100 : 100;

        metrics.add(ValidationMetricDto.builder()
                .category("Institutionnels")
                .total_records(institutionalTotal)
                .valid_records(institutionalValid)
                .quality_score(Math.round(institutionalScore * 100.0) / 100.0)
                .build());

        return metrics;
    }

    public List<AnomalyDto> getRecentAnomalies(int limit) {
        log.info("Getting {} recent anomalies", limit);
        return anomalyRepository.findTop10ByOrderByCreatedAtDesc()
                .stream().limit(limit).map(this::mapToAnomalyDto).collect(Collectors.toList());
    }

    private AnomalyDto mapToAnomalyDto(com.bsic.dataqualitybackend.model.Anomaly anomaly) {
        return AnomalyDto.builder()
                .id(anomaly.getId())
                .clientNumber(anomaly.getClientNumber())
                .clientName(anomaly.getClientName())
                .clientType(anomaly.getClientType())
                .structureCode(anomaly.getStructureCode())
                .structureName(anomaly.getStructureName())
                .fieldName(anomaly.getFieldName())
                .fieldLabel(anomaly.getFieldLabel())
                .currentValue(anomaly.getCurrentValue())
                .expectedValue(anomaly.getExpectedValue())
                .errorType(anomaly.getErrorType())
                .errorMessage(anomaly.getErrorMessage())
                .status(anomaly.getStatus())
                .createdAt(anomaly.getCreatedAt())
                .updatedAt(anomaly.getUpdatedAt())
                .build();
    }
}
