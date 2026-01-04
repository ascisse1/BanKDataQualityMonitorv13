package com.bsic.dataqualitybackend.model;

import jakarta.persistence.*;
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
@Entity
@Table(name = "kpis")
public class Kpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_date", nullable = false)
    private LocalDate periodDate;

    @Column(name = "agency_code")
    private String agencyCode;

    @Column(name = "kpi_type", nullable = false)
    private String kpiType;

    @Column(name = "kpi_value", nullable = false)
    private Double kpiValue;

    @Column(name = "target_value")
    private Double targetValue;

    @Column(name = "tickets_total")
    private Integer ticketsTotal;

    @Column(name = "tickets_closed")
    private Integer ticketsClosed;

    @Column(name = "tickets_sla_respected")
    private Integer ticketsSlaRespected;

    @Column(name = "tickets_sla_breached")
    private Integer ticketsSlaBreached;

    @Column(name = "avg_resolution_time_hours")
    private Double avgResolutionTimeHours;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
