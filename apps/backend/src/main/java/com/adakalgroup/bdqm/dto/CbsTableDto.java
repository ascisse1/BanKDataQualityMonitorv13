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
public class CbsTableDto {
    private Long id;
    private String tableName;
    private String displayName;
    private String description;
    private String schemaName;
    private String cbsVersion;
    private String primaryKeyColumns;
    private Boolean syncEnabled;
    private Integer syncOrder;
    private Boolean validationEnabled;
    private String pkField;
    private String labelField;
    private String labelFieldCorporate;
    private String structureField;
    private String typeField;
    private String cdcField;
    private LocalDateTime lastSyncAt;
    private String dataFilters;
    private Boolean active;
    private Integer fieldCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
