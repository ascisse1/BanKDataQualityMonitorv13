package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.CorrectionStatsDto;
import com.bsic.dataqualitybackend.dto.StatsDto;
import com.bsic.dataqualitybackend.model.CorrectionStats;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.CorrectionStatsRepository;
import com.bsic.dataqualitybackend.repository.FatcaClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final AnomalyRepository anomalyRepository;
    private final FatcaClientRepository fatcaClientRepository;
    private final CorrectionStatsRepository correctionStatsRepository;

    public StatsDto getGlobalStats() {
        long totalClients = fatcaClientRepository.count();
        long totalIndividual = fatcaClientRepository.countByClientType(ClientType.INDIVIDUAL);
        long totalCorporate = fatcaClientRepository.countByClientType(ClientType.CORPORATE);
        long totalInstitutional = fatcaClientRepository.countByClientType(ClientType.INSTITUTIONAL);

        long totalAnomalies = anomalyRepository.count();
        long pendingAnomalies = anomalyRepository.countByStatus(AnomalyStatus.PENDING);
        long correctedAnomalies = anomalyRepository.countByStatus(AnomalyStatus.CORRECTED);
        long validatedAnomalies = anomalyRepository.countByStatus(AnomalyStatus.VALIDATED);

        double correctionRate = totalAnomalies > 0
                ? (double) (correctedAnomalies + validatedAnomalies) / totalAnomalies * 100
                : 0.0;

        Map<String, Long> anomaliesByType = new HashMap<>();
        anomaliesByType.put("INDIVIDUAL", anomalyRepository.countByClientType(ClientType.INDIVIDUAL));
        anomaliesByType.put("CORPORATE", anomalyRepository.countByClientType(ClientType.CORPORATE));
        anomaliesByType.put("INSTITUTIONAL", anomalyRepository.countByClientType(ClientType.INSTITUTIONAL));

        Map<String, Long> anomaliesByStatus = new HashMap<>();
        for (AnomalyStatus status : AnomalyStatus.values()) {
            anomaliesByStatus.put(status.name(), anomalyRepository.countByStatus(status));
        }

        return StatsDto.builder()
                .totalClients(totalClients)
                .totalIndividual(totalIndividual)
                .totalCorporate(totalCorporate)
                .totalInstitutional(totalInstitutional)
                .totalAnomalies(totalAnomalies)
                .pendingAnomalies(pendingAnomalies)
                .correctedAnomalies(correctedAnomalies)
                .validatedAnomalies(validatedAnomalies)
                .correctionRate(correctionRate)
                .anomaliesByType(anomaliesByType)
                .anomaliesByStatus(anomaliesByStatus)
                .build();
    }

    public List<CorrectionStatsDto> getAgencyCorrectionStats() {
        LocalDate startDate = LocalDate.now().minusMonths(3);
        List<Object[]> results = correctionStatsRepository.getAgencyStatsSummary(startDate);

        return results.stream()
                .map(row -> CorrectionStatsDto.builder()
                        .agencyCode((String) row[0])
                        .agencyName((String) row[1])
                        .totalAnomalies(((Number) row[2]).intValue())
                        .correctedAnomalies(((Number) row[3]).intValue())
                        .validatedAnomalies(((Number) row[4]).intValue())
                        .correctionRate((Double) row[5])
                        .build())
                .collect(Collectors.toList());
    }

    public List<CorrectionStatsDto> getWeeklyCorrectionTrend(int weekNumber, int yearNumber) {
        return correctionStatsRepository.findByWeekAndYearOrderByRate(weekNumber, yearNumber)
                .stream()
                .map(this::mapCorrectionStatsToDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getValidationMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long totalAnomalies = anomalyRepository.count();
        long pending = anomalyRepository.countByStatus(AnomalyStatus.PENDING);
        long inProgress = anomalyRepository.countByStatus(AnomalyStatus.IN_PROGRESS);
        long corrected = anomalyRepository.countByStatus(AnomalyStatus.CORRECTED);
        long validated = anomalyRepository.countByStatus(AnomalyStatus.VALIDATED);
        long rejected = anomalyRepository.countByStatus(AnomalyStatus.REJECTED);

        metrics.put("totalAnomalies", totalAnomalies);
        metrics.put("pending", pending);
        metrics.put("inProgress", inProgress);
        metrics.put("corrected", corrected);
        metrics.put("validated", validated);
        metrics.put("rejected", rejected);

        double completionRate = totalAnomalies > 0
                ? (double) (validated) / totalAnomalies * 100
                : 0.0;
        metrics.put("completionRate", completionRate);

        return metrics;
    }

    private CorrectionStatsDto mapCorrectionStatsToDto(CorrectionStats stats) {
        return CorrectionStatsDto.builder()
                .id(stats.getId())
                .agencyCode(stats.getAgencyCode())
                .agencyName(stats.getAgencyName())
                .statsDate(stats.getStatsDate())
                .weekNumber(stats.getWeekNumber())
                .monthNumber(stats.getMonthNumber())
                .yearNumber(stats.getYearNumber())
                .totalAnomalies(stats.getTotalAnomalies())
                .correctedAnomalies(stats.getCorrectedAnomalies())
                .validatedAnomalies(stats.getValidatedAnomalies())
                .pendingAnomalies(stats.getPendingAnomalies())
                .correctionRate(stats.getCorrectionRate())
                .avgCorrectionTimeHours(stats.getAvgCorrectionTimeHours())
                .createdAt(stats.getCreatedAt())
                .build();
    }
}
