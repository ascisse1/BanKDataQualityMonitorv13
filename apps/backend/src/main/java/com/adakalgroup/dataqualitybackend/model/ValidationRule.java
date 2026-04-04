package com.adakalgroup.dataqualitybackend.model;

import com.adakalgroup.dataqualitybackend.model.converter.ClientTypeConverter;
import com.adakalgroup.dataqualitybackend.model.converter.RuleTypeConverter;
import com.adakalgroup.dataqualitybackend.model.enums.ClientType;
import com.adakalgroup.dataqualitybackend.model.enums.RuleType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Entity
@Table(schema = "public",name = "validation_rules", indexes = {
    @Index(name = "idx_rule_type", columnList = "rule_type"),
    @Index(name = "idx_rule_client_type", columnList = "client_type"),
    @Index(name = "idx_rule_active", columnList = "active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class ValidationRule {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 30)
    private String tableName;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Convert(converter = RuleTypeConverter.class)
    @Column(name = "rule_type", nullable = false)
    private RuleType ruleType;

    @Convert(converter = ClientTypeConverter.class)
    @Column(name = "client_type")
    private ClientType clientType;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    /**
     * User-friendly label for the field (e.g., "Numero d'identite").
     */
    @Column(name = "field_label")
    private String fieldLabel;

    /**
     * Natural language rule definition in JSON format.
     * Example: [{"type": "required"}, {"type": "minLength", "value": 8}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rule_definition", columnDefinition = "JSONB")
    private String ruleDefinition;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "severity")
    private String severity;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== HELPER METHODS FOR NEW FORMAT =====

    /**
     * Parse the JSON rule definition into a list of RuleCondition objects.
     * Returns empty list if ruleDefinition is null or invalid.
     */
    public List<RuleCondition> parseRuleConditions() {
        if (ruleDefinition == null || ruleDefinition.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(ruleDefinition, new TypeReference<List<RuleCondition>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse rule definition for rule {}: {}", ruleName, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Check if rule definition is valid (not null/empty).
     */
    public boolean hasValidRuleDefinition() {
        return ruleDefinition != null && !ruleDefinition.isBlank();
    }

    /**
     * Set rule conditions from a list (serializes to JSON).
     */
    public void setRuleConditions(List<RuleCondition> conditions) {
        if (conditions == null || conditions.isEmpty()) {
            this.ruleDefinition = null;
            return;
        }
        try {
            this.ruleDefinition = objectMapper.writeValueAsString(conditions);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize rule conditions: {}", e.getMessage());
        }
    }
}
