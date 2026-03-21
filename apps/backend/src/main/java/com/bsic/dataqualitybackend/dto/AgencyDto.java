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
public class AgencyDto {
    private String age;
    private String lib;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
