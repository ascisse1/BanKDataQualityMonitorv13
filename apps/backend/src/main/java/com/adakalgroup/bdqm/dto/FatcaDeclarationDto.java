package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.DeclarationStatus;
import com.adakalgroup.bdqm.model.enums.DeclarationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FatcaDeclarationDto {
    private Long id;
    private Integer reportingYear;
    private DeclarationType declarationType;
    private DeclarationStatus status;
    private String generatedBy;
    private LocalDateTime generatedAt;
    private String validatedBy;
    private LocalDateTime validatedAt;
    private String validationNotes;
    private String signedBy;
    private LocalDateTime signedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime ackReceivedAt;
    private String messageRefId;
    private String correctedMessageRefId;
    private Integer totalAccounts;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
