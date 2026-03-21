package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionStatsDto {
    private Long id;
    private String agencyCode;
    private String agencyName;
    private LocalDate statsDate;
    private Integer weekNumber;
    private Integer monthNumber;
    private Integer yearNumber;
    private Integer totalAnomalies;
    private Integer correctedAnomalies;
    private Integer validatedAnomalies;
    private Integer pendingAnomalies;
    private Double correctionRate;
    private Double avgCorrectionTimeHours;
    private LocalDateTime createdAt;
}
