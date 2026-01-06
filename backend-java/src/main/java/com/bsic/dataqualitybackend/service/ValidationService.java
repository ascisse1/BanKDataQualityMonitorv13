package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.ValidationRuleDto;
import com.bsic.dataqualitybackend.model.ValidationRule;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.ValidationRuleRepository;
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
        rule.setValidationExpression(dto.getValidationExpression());
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

    private ValidationRuleDto mapToDto(ValidationRule rule) {
        return ValidationRuleDto.builder()
            .id(rule.getId())
            .ruleName(rule.getRuleName())
            .description(rule.getDescription())
            .ruleType(rule.getRuleType())
            .clientType(rule.getClientType())
            .fieldName(rule.getFieldName())
            .validationExpression(rule.getValidationExpression())
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
            .validationExpression(dto.getValidationExpression())
            .errorMessage(dto.getErrorMessage())
            .severity(dto.getSeverity())
            .active(dto.getActive() != null ? dto.getActive() : true)
            .priority(dto.getPriority() != null ? dto.getPriority() : 0)
            .createdBy(dto.getCreatedBy())
            .build();
    }
}
