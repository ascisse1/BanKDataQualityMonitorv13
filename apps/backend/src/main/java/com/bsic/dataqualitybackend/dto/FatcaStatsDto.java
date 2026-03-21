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
public class FatcaStatsDto {
    private Long totalClients;
    private Long compliantClients;
    private Long nonCompliantClients;
    private Long pendingReview;
    private Long underInvestigation;
    private Long usPersons;
    private Long reportingRequired;
    private Double complianceRate;
    private Map<String, Long> clientsByStatus;
    private Map<String, Long> clientsByRiskLevel;
}
