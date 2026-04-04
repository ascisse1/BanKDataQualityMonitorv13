package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionResponse {

    private Long correctionId;
    private Long ticketId;
    private String ticketNumber;
    private String cli;
    private String fieldName;
    private String fieldLabel;
    private String oldValue;
    private String newValue;
    private TicketStatus ticketStatus;
    private String incidentStatus;
    private String processInstanceId;
    private LocalDateTime createdAt;
    private String message;

    // For 4 Eyes workflow tracking
    private boolean requiresValidation;
    private String assignedToUser;
    private LocalDateTime slaDeadline;
}
