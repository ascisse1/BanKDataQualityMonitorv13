package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.ValidationRuleDto;
import com.adakalgroup.bdqm.model.ValidationRule;
import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.repository.ValidationRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValidationService {

    private final ValidationRuleRepository validationRuleRepository;

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
        return mapToDto(updated);
    }

    @Transactional
    public void deleteRule(Long id) {
        validationRuleRepository.deleteById(id);
        log.info("Deleted validation rule with ID: {}", id);
    }

    @Transactional
    public void toggleRule(Long id, boolean active) {
        ValidationRule rule = validationRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Validation rule not found with id: " + id));

        rule.setActive(active);
        validationRuleRepository.save(rule);
        log.info("Toggled validation rule {} to {}", id, active);
    }

    @Transactional
    public void bulkToggle(List<Long> ids, boolean active) {
        List<ValidationRule> rules = validationRuleRepository.findAllById(ids);
        rules.forEach(rule -> rule.setActive(active));
        validationRuleRepository.saveAll(rules);
        log.info("Bulk toggled {} validation rules to {}", ids.size(), active);
    }

    @Transactional
    public void bulkDelete(List<Long> ids) {
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

    private ValidationRule mapToEntity(ValidationRuleDto dto) {
        return ValidationRule.builder()
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
