package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDto {
    private Long id;
    private String clientNumber;
    private String clientName;
    private ClientType clientType;
    private String agencyCode;
    private String agencyName;
    private String fieldName;
    private String fieldLabel;
    private String currentValue;
    private String expectedValue;
    private String errorType;
    private String errorMessage;
    private AnomalyStatus status;
    private String correctionValue;
    private String correctedBy;
    private LocalDateTime correctedAt;
    private String validationComment;
    private String validatedBy;
    private LocalDateTime validatedAt;
    private Long ticketId;
    private String severity;
    private String dataSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
