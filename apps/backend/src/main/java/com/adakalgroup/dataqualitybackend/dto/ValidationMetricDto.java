package com.adakalgroup.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for validation metrics per category.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationMetricDto {

    private String category;
    private long total_records;
    private long valid_records;
    private double quality_score;
}
