package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for dashboard client statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    private long total;
    private long individual;
    private long corporate;
    private long institutional;
    private long anomalies;
    private long fatca;

    // Additional stats
    private long pendingTickets;
    private long resolvedTickets;
    private double correctionRate;
}
