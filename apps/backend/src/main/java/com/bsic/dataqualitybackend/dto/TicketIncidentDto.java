package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketIncidentDto {

    private Long id;
    private String incidentType;
    private String category;
    private String fieldName;
    private String fieldLabel;
    private String oldValue;
    private String newValue;
    private String status;
    private Boolean resolved;
    private LocalDateTime resolvedAt;
    private String notes;
    private LocalDateTime createdAt;
}
