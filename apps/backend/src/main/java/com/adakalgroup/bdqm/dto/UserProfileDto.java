package com.adakalgroup.bdqm.dto;

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
public class UserProfileDto {
    private Long id;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private String status;

    private Integer userId;
    private String username;
    private String userFullName;

    private Long profileId;
    private String profileCode;
    private String profileName;

    private Long structureId;
    private String structureCode;
    private String structureName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
