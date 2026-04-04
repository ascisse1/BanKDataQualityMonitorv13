package com.adakalgroup.bdqm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NomenclatureTypeDto {
    private Long id;
    private String ctab;
    private String name;
    private String displayName;
    private String description;
    private Boolean syncEnabled;
    private Boolean active;
    private Integer entryCount;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
