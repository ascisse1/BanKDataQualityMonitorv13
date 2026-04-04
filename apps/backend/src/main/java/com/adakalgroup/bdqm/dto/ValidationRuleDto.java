package com.adakalgroup.bdqm.dto;

import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.RuleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationRuleDto {
    private Long id;
    private String tableName;
    private String ruleName;
    private String description;
    private RuleType ruleType;
    private ClientType clientType;
    private String fieldName;
    /** User-friendly label for the field (e.g., "Numero d'identite") */
    private String fieldLabel;
    /** Natural language rule definition in JSON format */
    private String ruleDefinition;
    private String errorMessage;
    private String severity;
    private Boolean active;
    private Integer priority;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
