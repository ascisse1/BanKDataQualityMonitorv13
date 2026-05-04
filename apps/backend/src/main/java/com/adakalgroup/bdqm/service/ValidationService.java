package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.ValidationRuleDto;
import com.adakalgroup.bdqm.model.Anomaly;
import com.adakalgroup.bdqm.model.RuleCondition;
import com.adakalgroup.bdqm.model.ValidationRule;
import com.adakalgroup.bdqm.model.enums.AnomalyStatus;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import com.adakalgroup.bdqm.repository.ValidationRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValidationService {

    private final ValidationRuleRepository validationRuleRepository;
    private final AnomalyRepository anomalyRepository;
    private final NaturalLanguageRuleParser ruleParser;

    public List<ValidationRuleDto> getAllRules() {
        return validationRuleRepository.findAll()
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public List<ValidationRuleDto> getActiveRules() {
        return validationRuleRepository.findByActiveOrderByPriorityDesc(true)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public List<ValidationRuleDto> getRulesByClientType(ClientType clientType) {
        return validationRuleRepository.findByActiveAndClientType(true, clientType)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public List<ValidationRuleDto> getRulesByField(String fieldName) {
        return validationRuleRepository.findByActiveAndFieldName(true, fieldName)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public ValidationRuleDto createRule(ValidationRuleDto dto) {
        ValidationRule rule = mapToEntity(dto);
        ValidationRule saved = validationRuleRepository.save(rule);
        log.info("Created validation rule with ID: {}", saved.getId());
        return mapToDto(saved);
    }

    @Transactional
    public ValidationRuleDto updateRule(Long id, ValidationRuleDto dto) {
        ValidationRule rule = validationRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Validation rule not found with id: " + id));

        // Capture old state before update for comparison
        String oldFieldName = rule.getFieldName();
        String oldRuleDefinition = rule.getRuleDefinition();
        String oldSeverity = rule.getSeverity();
        String oldErrorMessage = rule.getErrorMessage();
        Boolean oldActive = rule.getActive();
        String errorType = rule.getRuleType() != null ? rule.getRuleType().name() : null;

        rule.setTableName(dto.getTableName() != null ? dto.getTableName() : "bkcli");
        rule.setRuleName(dto.getRuleName());
        rule.setDescription(dto.getDescription());
        rule.setRuleType(dto.getRuleType());
        rule.setClientType(dto.getClientType());
        rule.setFieldName(dto.getFieldName());
        rule.setFieldLabel(dto.getFieldLabel());
        rule.setRuleDefinition(dto.getRuleDefinition());
        rule.setErrorMessage(dto.getErrorMessage());
        rule.setSeverity(dto.getSeverity());
        rule.setActive(dto.getActive());
        rule.setPriority(dto.getPriority());

        ValidationRule updated = validationRuleRepository.save(rule);
        log.info("Updated validation rule with ID: {}", updated.getId());

        // Re-evaluate open anomalies based on what changed
        reEvaluateOnRuleUpdate(updated, oldFieldName, oldRuleDefinition, oldSeverity, oldErrorMessage, oldActive, errorType);

        return mapToDto(updated);
    }

    @Transactional
    public void deleteRule(Long id) {
        ValidationRule rule = validationRuleRepository.findById(id).orElse(null);
        if (rule != null) {
            String fieldName = rule.getFieldName();
            String errorType = rule.getRuleType() != null ? rule.getRuleType().name() : null;
            validationRuleRepository.delete(rule);
            log.info("Deleted validation rule with ID: {}", id);
            closeAnomaliesForRemovedRule(fieldName, errorType);
        }
    }

    @Transactional
    public void toggleRule(Long id, boolean active) {
        ValidationRule rule = validationRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Validation rule not found with id: " + id));

        rule.setActive(active);
        validationRuleRepository.save(rule);
        log.info("Toggled validation rule {} to {}", id, active);

        if (!active) {
            String errorType = rule.getRuleType() != null ? rule.getRuleType().name() : null;
            closeAnomaliesForRemovedRule(rule.getFieldName(), errorType);
        }
    }

    @Transactional
    public void bulkToggle(List<Long> ids, boolean active) {
        List<ValidationRule> rules = validationRuleRepository.findAllById(ids);
        rules.forEach(rule -> rule.setActive(active));
        validationRuleRepository.saveAll(rules);
        log.info("Bulk toggled {} validation rules to {}", ids.size(), active);

        if (!active) {
            rules.forEach(rule -> {
                String errorType = rule.getRuleType() != null ? rule.getRuleType().name() : null;
                closeAnomaliesForRemovedRule(rule.getFieldName(), errorType);
            });
        }
    }

    @Transactional
    public void bulkDelete(List<Long> ids) {
        List<ValidationRule> rules = validationRuleRepository.findAllById(ids);
        rules.forEach(rule -> {
            String errorType = rule.getRuleType() != null ? rule.getRuleType().name() : null;
            closeAnomaliesForRemovedRule(rule.getFieldName(), errorType);
        });
        validationRuleRepository.deleteAllById(ids);
        log.info("Bulk deleted {} validation rules", ids.size());
    }

    @Transactional
    public void updatePriorities(List<PriorityUpdate> priorities) {
        for (PriorityUpdate update : priorities) {
            validationRuleRepository.findById(update.getId()).ifPresent(rule -> {
                rule.setPriority(update.getPriority());
                validationRuleRepository.save(rule);
            });
        }
        log.info("Updated priorities for {} validation rules", priorities.size());
    }

    public record PriorityUpdate(Long id, Integer priority) {
        public Long getId() { return id; }
        public Integer getPriority() { return priority; }
    }

    private ValidationRuleDto mapToDto(ValidationRule rule) {
        return ValidationRuleDto.builder()
            .id(rule.getId())
            .tableName(rule.getTableName())
            .ruleName(rule.getRuleName())
            .description(rule.getDescription())
            .ruleType(rule.getRuleType())
            .clientType(rule.getClientType())
            .fieldName(rule.getFieldName())
            .fieldLabel(rule.getFieldLabel())
            .ruleDefinition(rule.getRuleDefinition())
            .errorMessage(rule.getErrorMessage())
            .severity(rule.getSeverity())
            .active(rule.getActive())
            .priority(rule.getPriority())
            .createdBy(rule.getCreatedBy())
            .createdAt(rule.getCreatedAt())
            .updatedAt(rule.getUpdatedAt())
            .build();
    }

    // ===== ANOMALY RE-EVALUATION ON RULE CHANGE =====

    /**
     * Re-evaluate open anomalies after a rule update.
     * - Rule deactivated: close matching anomalies
     * - Conditions changed: re-check currentValue against new conditions, close those that now pass
     * - Metadata changed (severity/message): propagate to open anomalies
     */
    private void reEvaluateOnRuleUpdate(ValidationRule updatedRule, String oldFieldName,
                                         String oldRuleDefinition, String oldSeverity,
                                         String oldErrorMessage, Boolean oldActive, String oldErrorType) {
        // Rule was deactivated
        if (Boolean.TRUE.equals(oldActive) && !Boolean.TRUE.equals(updatedRule.getActive())) {
            closeAnomaliesForRemovedRule(oldFieldName, oldErrorType);
            return;
        }

        // Rule is not active — no anomalies to update
        if (!Boolean.TRUE.equals(updatedRule.getActive())) {
            return;
        }

        String errorType = updatedRule.getRuleType() != null ? updatedRule.getRuleType().name() : null;

        // Conditions changed — re-check currentValues against new rule
        boolean conditionsChanged = !java.util.Objects.equals(oldRuleDefinition, updatedRule.getRuleDefinition());
        if (conditionsChanged) {
            reValidateAnomaliesAgainstRule(oldFieldName, oldErrorType, updatedRule);
        }

        // Metadata changed (severity or errorMessage) — propagate to open anomalies
        boolean severityChanged = !java.util.Objects.equals(oldSeverity, updatedRule.getSeverity());
        boolean messageChanged = !java.util.Objects.equals(oldErrorMessage, updatedRule.getErrorMessage());
        if (severityChanged || messageChanged) {
            propagateMetadataToAnomalies(oldFieldName, oldErrorType, updatedRule.getSeverity(), updatedRule.getErrorMessage());
        }
    }

    /**
     * Close open anomalies when a rule is deleted or deactivated.
     * Only closes anomalies if no other active rule covers the same field+errorType.
     */
    private void closeAnomaliesForRemovedRule(String fieldName, String errorType) {
        if (fieldName == null || errorType == null) return;

        // Check if another active rule still covers this field
        List<ValidationRule> remainingRules = validationRuleRepository.findByActiveAndFieldName(true, fieldName);
        boolean otherRuleCoversField = remainingRules.stream()
                .anyMatch(r -> r.getRuleType() != null && r.getRuleType().name().equals(errorType));

        if (otherRuleCoversField) {
            log.info("Another active rule still covers field={} errorType={}, skipping anomaly closure", fieldName, errorType);
            return;
        }

        List<Anomaly> openAnomalies = anomalyRepository.findOpenAnomaliesByFieldAndErrorType(fieldName, errorType);
        if (openAnomalies.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        for (Anomaly anomaly : openAnomalies) {
            anomaly.setStatus(AnomalyStatus.CLOSED);
            anomaly.setDataSource("RULE_CHANGE_RESOLVED");
            anomaly.setValidationComment("Fermée automatiquement: règle désactivée ou supprimée");
            anomaly.setValidatedAt(now);
        }
        anomalyRepository.saveAll(openAnomalies);
        log.info("Closed {} open anomalies for removed/deactivated rule: field={}, errorType={}",
                openAnomalies.size(), fieldName, errorType);
    }

    /**
     * Re-validate open anomalies against updated rule conditions.
     * Anomalies whose currentValue now passes the updated rule are auto-closed.
     */
    private void reValidateAnomaliesAgainstRule(String fieldName, String errorType, ValidationRule updatedRule) {
        if (fieldName == null || errorType == null) return;

        List<Anomaly> openAnomalies = anomalyRepository.findOpenAnomaliesByFieldAndErrorType(fieldName, errorType);
        if (openAnomalies.isEmpty()) return;

        List<RuleCondition> conditions = updatedRule.parseRuleConditions();
        if (conditions.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        int closedCount = 0;
        for (Anomaly anomaly : openAnomalies) {
            NaturalLanguageRuleParser.ValidationResult result = ruleParser.validateAll(anomaly.getCurrentValue(), conditions);
            if (result.isValid()) {
                anomaly.setStatus(AnomalyStatus.CLOSED);
                anomaly.setDataSource("RULE_CHANGE_RESOLVED");
                anomaly.setValidationComment("Fermée automatiquement: la valeur satisfait la règle mise à jour");
                anomaly.setValidatedAt(now);
                closedCount++;
            } else {
                // Update error message to reflect new rule conditions
                anomaly.setErrorMessage(result.message());
                anomaly.setSeverity(updatedRule.getSeverity());
            }
        }
        anomalyRepository.saveAll(openAnomalies);
        log.info("Re-validated {} anomalies for updated rule: field={}, errorType={} — {} closed, {} updated",
                openAnomalies.size(), fieldName, errorType, closedCount, openAnomalies.size() - closedCount);
    }

    /**
     * Propagate metadata changes (severity, error message) to open anomalies.
     */
    private void propagateMetadataToAnomalies(String fieldName, String errorType,
                                               String newSeverity, String newErrorMessage) {
        if (fieldName == null || errorType == null) return;

        List<Anomaly> openAnomalies = anomalyRepository.findOpenAnomaliesByFieldAndErrorType(fieldName, errorType);
        if (openAnomalies.isEmpty()) return;

        for (Anomaly anomaly : openAnomalies) {
            if (newSeverity != null) anomaly.setSeverity(newSeverity);
            if (newErrorMessage != null) anomaly.setErrorMessage(newErrorMessage);
        }
        anomalyRepository.saveAll(openAnomalies);
        log.info("Propagated metadata to {} open anomalies for field={}, errorType={}", openAnomalies.size(), fieldName, errorType);
    }

    private ValidationRule mapToEntity(ValidationRuleDto dto) {
        return ValidationRule.builder()
            .tableName(dto.getTableName() != null ? dto.getTableName() : "bkcli")
            .ruleName(dto.getRuleName())
            .description(dto.getDescription())
            .ruleType(dto.getRuleType())
            .clientType(dto.getClientType())
            .fieldName(dto.getFieldName())
            .fieldLabel(dto.getFieldLabel())
            .ruleDefinition(dto.getRuleDefinition())
            .errorMessage(dto.getErrorMessage())
            .severity(dto.getSeverity())
            .active(dto.getActive() != null ? dto.getActive() : true)
            .priority(dto.getPriority() != null ? dto.getPriority() : 0)
            .createdBy(dto.getCreatedBy())
            .build();
    }
}
