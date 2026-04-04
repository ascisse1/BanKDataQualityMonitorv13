package com.adakalgroup.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for anomaly counts per branch/agency.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchAnomalyDto {

    private String code_agence;
    private String lib_agence;
    private long nombre_anomalies;
}
