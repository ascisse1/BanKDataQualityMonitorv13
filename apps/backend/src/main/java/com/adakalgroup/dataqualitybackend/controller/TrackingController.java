package com.adakalgroup.dataqualitybackend.controller;

import com.adakalgroup.dataqualitybackend.dto.ApiResponse;
import com.adakalgroup.dataqualitybackend.dto.TrackingDataDto;
import com.adakalgroup.dataqualitybackend.model.enums.AnomalyStatus;
import com.adakalgroup.dataqualitybackend.repository.AnomalyRepository;
import com.adakalgroup.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final AnomalyRepository anomalyRepository;
    private final TicketRepository ticketRepository;

    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<TrackingDataDto>>> getGlobalTracking() {
        // Aggregate anomaly counts per structure and status
        List<Object[]> rows = anomalyRepository.countByAgencyAndStatusGrouped();

        // Group by structureCode: { code -> { status -> count } }
        Map<String, String> codeToName = new LinkedHashMap<>();
        Map<String, Map<AnomalyStatus, Long>> byStructure = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String code = (String) row[0];
            String name = row[1] != null ? (String) row[1] : code;
            AnomalyStatus status = (AnomalyStatus) row[2];
            long count = ((Number) row[3]).longValue();

            codeToName.putIfAbsent(code, name);
            byStructure
                .computeIfAbsent(code, k -> new EnumMap<>(AnomalyStatus.class))
                .put(status, count);
        }

        List<TrackingDataDto> result = byStructure.entrySet().stream().map(entry -> {
            String code = entry.getKey();
            Map<AnomalyStatus, Long> statusCounts = entry.getValue();

            long total = statusCounts.values().stream().mapToLong(Long::longValue).sum();
            long corrected = statusCounts.getOrDefault(AnomalyStatus.CORRECTED, 0L);
            long validated = statusCounts.getOrDefault(AnomalyStatus.VALIDATED, 0L);
            long closed = statusCounts.getOrDefault(AnomalyStatus.CLOSED, 0L);
            long fiabilises = corrected + validated + closed;
            long openAnomalies = total - fiabilises;

            double tauxAnomalies = total > 0 ? (openAnomalies * 100.0 / total) : 0.0;
            double tauxFiabilisation = total > 0 ? (fiabilises * 100.0 / total) : 0.0;

            return TrackingDataDto.builder()
                .structureCode(code)
                .structureName(codeToName.get(code))
                .flux(TrackingDataDto.FluxDto.builder()
                    .total(total)
                    .anomalies(openAnomalies)
                    .fiabilises(fiabilises)
                    .build())
                .stock(TrackingDataDto.StockDto.builder()
                    .actifs(total)
                    .anomalies(openAnomalies)
                    .fiabilises(fiabilises)
                    .build())
                .general(TrackingDataDto.GeneralDto.builder()
                    .actifs(total)
                    .anomalies(openAnomalies)
                    .fiabilises(fiabilises)
                    .build())
                .indicators(TrackingDataDto.IndicatorsDto.builder()
                    .tauxAnomalies(Math.round(tauxAnomalies * 10.0) / 10.0)
                    .tauxFiabilisation(Math.round(tauxFiabilisation * 10.0) / 10.0)
                    .build())
                .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
