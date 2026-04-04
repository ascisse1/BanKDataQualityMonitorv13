package com.adakalgroup.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructureDto {
    private Long id;
    private String code;
    private String name;
    private String type;
    private Long parentId;
    private String parentName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
