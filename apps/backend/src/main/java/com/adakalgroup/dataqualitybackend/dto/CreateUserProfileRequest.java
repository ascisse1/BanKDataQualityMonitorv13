package com.adakalgroup.dataqualitybackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserProfileRequest {
    @NotNull
    private Integer userId;

    @NotNull
    private Long structureId;

    private Long profileId;

    @NotNull
    private LocalDate dateFrom;

    private LocalDate dateTo;
}
