package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsDto {
    private Long totalClients;
    private Long totalIndividual;
    private Long totalCorporate;
    private Long totalInstitutional;
    private Long totalAnomalies;
    private Long pendingAnomalies;
    private Long correctedAnomalies;
    private Long validatedAnomalies;
    private Double correctionRate;
    private Map<String, Long> anomaliesByType;
    private Map<String, Long> anomaliesByStatus;
}
