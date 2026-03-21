package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {

    private Long id;
    private String ticketNumber;
    private String cli;
    private String clientName;
    private String clientType;
    private String agencyCode;
    private TicketStatus status;
    private TicketPriority priority;
    private UserDto assignedTo;
    private UserDto assignedBy;
    private LocalDateTime assignedAt;
    private UserDto validatedBy;
    private LocalDateTime validatedAt;
    private LocalDateTime slaDeadline;
    private Boolean slaBreached;
    private Integer totalIncidents;
    private Integer resolvedIncidents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
