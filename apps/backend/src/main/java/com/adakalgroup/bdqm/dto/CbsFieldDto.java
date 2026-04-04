package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.CbsDataType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CbsFieldDto {
    private Long id;
    private Long cbsTableId;
    private String tableName;
    private String columnName;
    private String displayLabel;
    private String description;
    private String queryAlias;
    private CbsDataType dataType;
    private Integer maxLength;
    private Integer precisionValue;
    private Integer scaleValue;
    private Boolean isPrimaryKey;
    private Boolean isRequired;
    private Boolean isUpdatable;
    private String nomenclatureCtab;
    private String nomenclatureDescription;
    private String enumValues;
    private String applicableClientTypes;
    private String apiFieldPath;
    private Integer displayOrder;
    private String fieldGroup;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
