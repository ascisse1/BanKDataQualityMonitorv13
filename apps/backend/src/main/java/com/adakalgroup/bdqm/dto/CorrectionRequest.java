package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionRequest {

    @NotBlank(message = "Client ID is required")
    private String cli;

    @NotBlank(message = "Field name is required")
    private String fieldName;

    private String fieldLabel;

    private String oldValue;

    private String newValue;

    @NotBlank(message = "Agency code is required")
    private String structureCode;

    private String notes;

    @NotNull(message = "Action is required")
    private CorrectionAction action;

    private TicketPriority priority;

    private RejectionReason rejectionReason;

    public enum CorrectionAction {
        FIX,        // Submit correction for validation
        REVIEW,     // Mark for review (no correction yet)
        REJECT      // Reject the anomaly as invalid
    }

    public enum RejectionReason {
        FALSE_POSITIVE,
        DUPLICATE,
        OUT_OF_SCOPE,
        INSUFFICIENT_INFO,
        DATA_SOURCE_ERROR,
        OTHER
    }
}
