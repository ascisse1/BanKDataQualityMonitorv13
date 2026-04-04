package com.adakalgroup.dataqualitybackend.dto;

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

    // Overall quality score (weighted by record count across categories)
    private double overallQualityScore;

    // Ticket aging buckets (pending tickets by age)
    private long ticketsUnder24h;
    private long tickets24to48h;
    private long ticketsOver48h;

    // Period-based correction rate (last 30 days)
    private double periodCorrectionRate;
}
