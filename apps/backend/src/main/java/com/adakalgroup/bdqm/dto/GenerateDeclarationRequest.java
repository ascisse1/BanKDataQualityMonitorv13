package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.DeclarationType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDeclarationRequest {

    @NotNull(message = "Reporting year is required")
    private Integer reportingYear;

    @NotNull(message = "Declaration type is required")
    private DeclarationType declarationType;

    private String correctedMessageRefId;

    private String notes;
}
