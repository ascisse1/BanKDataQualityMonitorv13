package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.AnomalyDto;
import com.bsic.dataqualitybackend.dto.BranchAnomalyDto;
import com.bsic.dataqualitybackend.dto.DashboardStatsDto;
import com.bsic.dataqualitybackend.dto.ValidationMetricDto;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for dashboard statistics and metrics.
 * Uses jOOQ for client counts on the PostgreSQL mirror table (dictionary-driven).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatsService {

    private final AnomalyRepository anomalyRepository;
    private final TicketRepository ticketRepository;
    private final DSLContext primaryDsl;

    public DashboardStatsDto getClientStats() {
        log.info("Calculating client statistics for dashboard");

        long totalClients = countClients(null);
        long individualClients = countClients("1");
        long corporateClients = countClients("2");
        long institutionalClients = countClients("3");

        long totalAnomalies = anomalyRepository.count();
        long correctedAnomalies = anomalyRepository.countByStatus(AnomalyStatus.CORRECTED);

        long fatcaCount = anomalyRepository.countByClientTypeAndStatus(ClientType.INDIVIDUAL, AnomalyStatus.PENDING)
                + anomalyRepository.countByClientTypeAndStatus(ClientType.INDIVIDUAL, AnomalyStatus.IN_PROGRESS);

        long pendingTickets = ticketRepository.countByStatus(TicketStatus.DETECTED) +
                              ticketRepository.countByStatus(TicketStatus.ASSIGNED) +
                              ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long resolvedTickets = ticketRepository.countByStatus(TicketStatus.CLOSED);

        double correctionRate = totalAnomalies > 0 ?
                (double) correctedAnomalies / totalAnomalies * 100 : 0;

        // Overall quality score (weighted average across client categories)
        double overallQualityScore = calculateOverallQualityScore();

        // Ticket aging buckets
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime h24Ago = now.minusHours(24);
        LocalDateTime h48Ago = now.minusHours(48);
        long ticketsUnder24h = ticketRepository.countPendingTicketsCreatedAfter(h24Ago);
        long tickets24to48h = ticketRepository.countPendingTicketsBetween(h48Ago, h24Ago);
        long ticketsOver48h = ticketRepository.countPendingTicketsCreatedBefore(h48Ago);

        // Period-based correction rate (last 30 days)
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        long periodTotal = anomalyRepository.countCreatedAfter(thirtyDaysAgo);
        long periodCorrected = anomalyRepository.countByStatusUpdatedAfter(AnomalyStatus.CORRECTED, thirtyDaysAgo);
        double periodCorrectionRate = periodTotal > 0 ?
                (double) periodCorrected / periodTotal * 100 : 0;

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
                .overallQualityScore(Math.round(overallQualityScore * 100.0) / 100.0)
                .ticketsUnder24h(ticketsUnder24h)
                .tickets24to48h(tickets24to48h)
                .ticketsOver48h(ticketsOver48h)
                .periodCorrectionRate(Math.round(periodCorrectionRate * 100.0) / 100.0)
                .build();
    }

    private double calculateOverallQualityScore() {
        long individualTotal = countClients("1");
        long individualWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.INDIVIDUAL);

        long corporateTotal = countClients("2");
        long corporateWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.CORPORATE);

        long institutionalTotal = countClients("3");
        long institutionalWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.INSTITUTIONAL);

        long grandTotal = individualTotal + corporateTotal + institutionalTotal;
        if (grandTotal == 0) return 100.0;

        long totalValid = (individualTotal - individualWithIssues)
                + (corporateTotal - corporateWithIssues)
                + (institutionalTotal - institutionalWithIssues);

        return (double) totalValid / grandTotal * 100;
    }

    public List<Map<String, Object>> getQualityTrends(int months) {
        List<ValidationMetricDto> currentMetrics = getValidationMetrics();
        List<Map<String, Object>> trends = new ArrayList<>();

        // Return current snapshot per category
        for (ValidationMetricDto metric : currentMetrics) {
            trends.add(Map.of(
                "category", metric.getCategory(),
                "qualityScore", metric.getQuality_score(),
                "totalRecords", metric.getTotal_records(),
                "validRecords", metric.getValid_records()
            ));
        }

        return trends;
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

        // Count distinct clients with open anomalies (not total anomaly rows)
        // A client with 5 bad fields = 5 anomalies but only 1 client with issues
        long individualTotal = countClients("1");
        long individualWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.INDIVIDUAL);
        long individualValid = individualTotal - individualWithIssues;
        double individualScore = individualTotal > 0 ? (double) individualValid / individualTotal * 100 : 100;

        metrics.add(ValidationMetricDto.builder()
                .category("Particuliers")
                .total_records(individualTotal)
                .valid_records(individualValid)
                .quality_score(Math.round(individualScore * 100.0) / 100.0)
                .build());

        long corporateTotal = countClients("2");
        long corporateWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.CORPORATE);
        long corporateValid = corporateTotal - corporateWithIssues;
        double corporateScore = corporateTotal > 0 ? (double) corporateValid / corporateTotal * 100 : 100;

        metrics.add(ValidationMetricDto.builder()
                .category("Entreprises")
                .total_records(corporateTotal)
                .valid_records(corporateValid)
                .quality_score(Math.round(corporateScore * 100.0) / 100.0)
                .build());

        long institutionalTotal = countClients("3");
        long institutionalWithIssues = anomalyRepository.countDistinctClientsWithOpenAnomalies(ClientType.INSTITUTIONAL);
        long institutionalValid = institutionalTotal - institutionalWithIssues;
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

    /**
     * Count clients in the bkcli mirror table using jOOQ.
     * @param tcli client type filter ("1", "2", "3"), or null for all
     */
    private long countClients(String tcli) {
        try {
            if (tcli == null) {
                return primaryDsl.fetchCount(DSL.table("cbs.bkcli"));
            }
            return primaryDsl.fetchCount(
                    DSL.table("cbs.bkcli"),
                    DSL.field("tcli").eq(tcli));
        } catch (Exception e) {
            log.warn("Error counting clients (tcli={}): {}", tcli, e.getMessage());
            return 0;
        }
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
