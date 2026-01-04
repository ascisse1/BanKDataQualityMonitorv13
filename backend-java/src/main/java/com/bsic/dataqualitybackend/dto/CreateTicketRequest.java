package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.TicketPriority;
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
public class CreateTicketRequest {

    @NotBlank(message = "Client ID is required")
    private String cli;

    @NotBlank(message = "Agency code is required")
    private String agencyCode;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;
}
