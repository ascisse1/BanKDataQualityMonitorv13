package com.adakalgroup.bdqm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Filter(name = "structureFilter", condition = "structure_code IN (:codes)")
@Table(schema = "public",name = "correction_stats", indexes = {
    @Index(name = "idx_stats_agency", columnList = "structure_code"),
    @Index(name = "idx_stats_date", columnList = "stats_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "structure_code", nullable = false)
    private String structureCode;

    @Column(name = "structure_name")
    private String structureName;

    @Column(name = "stats_date", nullable = false)
    private LocalDate statsDate;

    @Column(name = "week_number")
    private Integer weekNumber;

    @Column(name = "month_number")
    private Integer monthNumber;

    @Column(name = "year_number")
    private Integer yearNumber;

    @Column(name = "total_anomalies")
    @Builder.Default
    private Integer totalAnomalies = 0;

    @Column(name = "corrected_anomalies")
    @Builder.Default
    private Integer correctedAnomalies = 0;

    @Column(name = "validated_anomalies")
    @Builder.Default
    private Integer validatedAnomalies = 0;

    @Column(name = "pending_anomalies")
    @Builder.Default
    private Integer pendingAnomalies = 0;

    @Column(name = "correction_rate")
    private Double correctionRate;

    @Column(name = "avg_correction_time_hours")
    private Double avgCorrectionTimeHours;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
