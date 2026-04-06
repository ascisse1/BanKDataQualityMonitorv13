package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.CbsTableDto;
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

import java.util.*;

/**
 * Table-agnostic CBS validation service.
 * Validates records from ANY CBS table using dictionary metadata + validation rules.
 * No hardcoded field names — everything driven by cbs_tables config.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CbsValidationService {

    private final ValidationRuleRepository validationRuleRepository;
    private final AnomalyRepository anomalyRepository;
    private final StructureService structureService;
    private final NaturalLanguageRuleParser naturalLanguageRuleParser;
    private final CbsDataDictionaryService dataDictionaryService;
    private final NomenclatureService nomenclatureService;

    /**
     * Validate records from any CBS table and create/auto-resolve anomalies.
     * Table metadata (PK, label, structure, type fields) comes from cbs_tables.
     *
     * @param tableName CBS table name (e.g., "bkcli", "bkcom")
     * @param records   List of records as Map
     * @return ValidationResult with statistics
     */
    @Transactional
    public ValidationResult validateRecords(String tableName, List<Map<String, Object>> records) {
        log.info("Starting validation for {} records from table '{}'", records.size(), tableName);

        // Load table metadata
        CbsTableDto tableConfig = dataDictionaryService.getTableByName(tableName);
        String pkField = tableConfig.getPkField() != null ? tableConfig.getPkField().toLowerCase() : null;
        String typeField = tableConfig.getTypeField() != null ? tableConfig.getTypeField().toLowerCase() : null;
        String structureField = tableConfig.getStructureField() != null ? tableConfig.getStructureField().toLowerCase() : null;

        log.info("Table '{}' config: pkField={}, typeField={}, structureField={}", tableName, pkField, typeField, structureField);

        if (pkField == null || pkField.isBlank()) {
            log.warn("Table '{}' has no pkField configured, skipping validation", tableName);
            return new ValidationResult(records.size(), 0, 0, 0, 0);
        }

        // Load field labels from dictionary
        Map<String, String> fieldLabels = loadFieldLabels(tableName);
        log.info("Table '{}': loaded {} field labels", tableName, fieldLabels.size());

        // Load active rules for this table
        List<ValidationRule> allActiveRules = validationRuleRepository
                .findByActiveAndTableNameOrderByPriorityDesc(true, tableName);
        log.info("Loaded {} active validation rules for table '{}'", allActiveRules.size(), tableName);
        allActiveRules.forEach(r -> log.info("  Rule: name={}, field={}, type={}, definition={}",
                r.getRuleName(), r.getFieldName(), r.getRuleType(), r.getRuleDefinition()));

        int totalAnomalies = 0;
        int skippedDuplicates = 0;
        int autoResolved = 0;
        int errors = 0;

        Map<String, String> structureNames = new HashMap<>();

        // Batch collections for bulk save
        List<Anomaly> anomaliesToCreate = new ArrayList<>();
        List<Anomaly> anomaliesToResolve = new ArrayList<>();

        // Bulk load all open anomalies for this batch (eliminates N+1 queries)
        Set<String> allPks = new HashSet<>();
        for (Map<String, Object> record : records) {
            String pk = getString(record, pkField);
            if (pk != null) allPks.add(pk);
        }
        log.info("Table '{}': bulk loading open anomalies for {} records", tableName, allPks.size());

        Map<String, Set<String>> existingAnomalyMap = new HashMap<>();
        Map<String, List<Anomaly>> openAnomalyMap = new HashMap<>();

        if (!allPks.isEmpty()) {
            List<Anomaly> allOpenAnomalies = anomalyRepository.findOpenAnomaliesByClientNumbers(allPks);
            for (Anomaly a : allOpenAnomalies) {
                existingAnomalyMap
                        .computeIfAbsent(a.getClientNumber(), k -> new HashSet<>())
                        .add(a.getFieldName());
                openAnomalyMap
                        .computeIfAbsent(a.getClientNumber(), k -> new ArrayList<>())
                        .add(a);
            }
            log.info("Table '{}': loaded {} existing open anomalies in bulk", tableName, allOpenAnomalies.size());
        }

        for (Map<String, Object> record : records) {
            try {
                String pk = getString(record, pkField);
                if (pk == null) {
                    log.info("Record skipped: pkField '{}' is null. Record keys: {}", pkField, record.keySet());
                    continue;
                }

                ClientType clientType = null;
                if (typeField != null && !typeField.isBlank()) {
                    clientType = getClientType(getString(record, typeField));
                }
                log.info("Record pk={}: clientType={}, typeField={}, typeValue={}",
                        pk, clientType, typeField, getString(record, typeField));

                String structureCode = structureField != null ? getString(record, structureField) : null;
                String structureName = getStructureName(structureCode, structureNames);

                Set<String> failedFields = new HashSet<>();
                List<ValidationRule> applicableRules = getApplicableRules(allActiveRules, clientType);
                log.info("Record pk={}: {} applicable rules out of {}", pk, applicableRules.size(), allActiveRules.size());

                Set<String> existingFields = existingAnomalyMap.getOrDefault(pk, Collections.emptySet());

                for (ValidationRule rule : applicableRules) {
                    try {
                        ValidationFailure failure = validateRecordAgainstRule(record, rule, fieldLabels);

                        if (failure != null) {
                            log.info("Record pk={}: FAILED rule '{}' on field '{}' — value='{}', expected='{}'",
                                    pk, rule.getRuleName(), failure.fieldName(), failure.currentValue(), failure.expectedValue());
                            failedFields.add(rule.getFieldName());

                            if (existingFields.contains(rule.getFieldName())) {
                                log.info("Record pk={}: anomaly already exists for field '{}', skipping", pk, rule.getFieldName());
                                skippedDuplicates++;
                                continue;
                            }

                            Anomaly anomaly = createAnomaly(
                                    pk, record, tableConfig, rule, failure, clientType, structureName);
                            anomaliesToCreate.add(anomaly);
                            totalAnomalies++;
                            log.info("Record pk={}: anomaly CREATED for field '{}'", pk, rule.getFieldName());
                        } else {
                            log.info("Record pk={}: PASSED rule '{}' on field '{}'", pk, rule.getRuleName(), rule.getFieldName());
                        }
                    } catch (Exception e) {
                        log.error("Error validating rule {} for record {}: {}",
                                rule.getRuleName(), pk, e.getMessage());
                        errors++;
                    }
                }

                // Auto-resolve: mark open anomalies for fields that now PASS
                List<Anomaly> openAnomalies = openAnomalyMap.getOrDefault(pk, Collections.emptyList());
                for (Anomaly openAnomaly : openAnomalies) {
                    if (!failedFields.contains(openAnomaly.getFieldName())) {
                        openAnomaly.setStatus(AnomalyStatus.CORRECTED);
                        openAnomaly.setDataSource("CBS_AUTO_RESOLVED");
                        anomaliesToResolve.add(openAnomaly);
                        autoResolved++;
                        log.info("Auto-resolved anomaly for record {}, field {}", pk, openAnomaly.getFieldName());
                    }
                }

            } catch (Exception e) {
                log.error("Error validating record from '{}': {}", tableName, e.getMessage());
                errors++;
            }
        }

        // Batch save: one flush for new anomalies, one for resolved
        if (!anomaliesToCreate.isEmpty()) {
            anomalyRepository.saveAll(anomaliesToCreate);
            log.info("Table '{}': batch saved {} new anomalies", tableName, anomaliesToCreate.size());
        }
        if (!anomaliesToResolve.isEmpty()) {
            anomalyRepository.saveAll(anomaliesToResolve);
            log.info("Table '{}': batch saved {} auto-resolved anomalies", tableName, anomaliesToResolve.size());
        }

        log.info("Validation for '{}': created={}, auto-resolved={}, skipped={}, errors={}",
                tableName, totalAnomalies, autoResolved, skippedDuplicates, errors);

        return new ValidationResult(records.size(), totalAnomalies, autoResolved, skippedDuplicates, errors);
    }

    // ===== Rule evaluation =====

    private ValidationFailure validateRecordAgainstRule(Map<String, Object> record,
                                                        ValidationRule rule,
                                                        Map<String, String> fieldLabels) {
        if (!rule.hasValidRuleDefinition()) {
            log.info("Rule '{}': no valid definition, skipping", rule.getRuleName());
            return null;
        }

        String fieldName = rule.getFieldName().toLowerCase();
        Object fieldValue = record.get(fieldName);
        String stringValue = fieldValue != null ? fieldValue.toString().trim() : null;
        log.info("Rule '{}': field='{}', value='{}'", rule.getRuleName(), fieldName, stringValue);

        List<RuleCondition> conditions = rule.parseRuleConditions();
        if (conditions.isEmpty()) {
            log.info("Rule '{}': no conditions parsed from definition, skipping", rule.getRuleName());
            return null;
        }
        log.info("Rule '{}': {} conditions to evaluate", rule.getRuleName(), conditions.size());

        NaturalLanguageRuleParser.ValidationResult result =
                naturalLanguageRuleParser.validateAll(fieldValue, conditions);
        log.info("Rule '{}': valid={}, message={}", rule.getRuleName(), result.isValid(), result.message());

        if (!result.isValid()) {
            String fieldLabel = rule.getFieldLabel() != null ?
                    rule.getFieldLabel() :
                    fieldLabels.getOrDefault(rule.getFieldName(), rule.getFieldName());

            return new ValidationFailure(
                    rule.getFieldName(), fieldLabel, stringValue,
                    buildExpectedValueDescription(conditions),
                    rule.getRuleType() != null ? rule.getRuleType().name() : "VALIDATION",
                    result.message() != null ? result.message() : rule.getErrorMessage(),
                    rule.getSeverity()
            );
        }

        return null;
    }

    // ===== Anomaly creation =====

    private Anomaly createAnomaly(String pk, Map<String, Object> record, CbsTableDto tableConfig,
                                   ValidationRule rule, ValidationFailure failure,
                                   ClientType clientType, String structureName) {

        String recordLabel = buildRecordLabel(record, tableConfig, clientType);
        String structureCode = tableConfig.getStructureField() != null
                ? getString(record, tableConfig.getStructureField()) : null;

        return Anomaly.builder()
                .clientNumber(pk)
                .clientName(recordLabel)
                .clientType(clientType)
                .structureCode(structureCode != null ? structureCode : "00000")
                .structureName(structureName)
                .fieldName(failure.fieldName())
                .fieldLabel(failure.fieldLabel())
                .currentValue(failure.currentValue())
                .expectedValue(failure.expectedValue())
                .errorType(failure.errorType())
                .errorMessage(failure.errorMessage())
                .severity(failure.severity() != null ? failure.severity() : "MEDIUM")
                .status(AnomalyStatus.PENDING)
                .dataSource("CBS_SYNC")
                .build();
    }

    /**
     * Build a display label for a record using table metadata.
     * Uses labelField (CSV of field names) or labelFieldCorporate for corporate types.
     */
    private String buildRecordLabel(Map<String, Object> record, CbsTableDto tableConfig, ClientType clientType) {
        if ((clientType == ClientType.CORPORATE || clientType == ClientType.INSTITUTIONAL)
                && tableConfig.getLabelFieldCorporate() != null) {
            String val = getString(record, tableConfig.getLabelFieldCorporate());
            if (val != null) return val;
        }

        if (tableConfig.getLabelField() != null) {
            String[] labelFields = tableConfig.getLabelField().split(",");
            StringBuilder label = new StringBuilder();
            for (String f : labelFields) {
                String val = getString(record, f.trim());
                if (val != null) {
                    if (label.length() > 0) label.append(" ");
                    label.append(val);
                }
            }
            if (label.length() > 0) return label.toString();
        }

        return getString(record, tableConfig.getPkField());
    }

    // ===== Helpers =====

    private Map<String, String> loadFieldLabels(String tableName) {
        try {
            Map<String, String> labels = dataDictionaryService.getFieldLabels(tableName);
            return labels.isEmpty() ? Collections.emptyMap() : labels;
        } catch (Exception e) {
            log.warn("Failed to load field labels for '{}': {}", tableName, e.getMessage());
            return Collections.emptyMap();
        }
    }

    private ClientType getClientType(String tcli) {
        if (tcli == null || tcli.isBlank()) return null;
        try {
            return ClientType.fromCode(tcli.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private List<ValidationRule> getApplicableRules(List<ValidationRule> allRules, ClientType clientType) {
        if (clientType == null) return allRules;
        return allRules.stream()
                .filter(rule -> rule.getClientType() == null || rule.getClientType() == clientType)
                .toList();
    }

    private String getStructureName(String structureCode, Map<String, String> cache) {
        if (structureCode == null || structureCode.isBlank()) return "Unknown";
        return cache.computeIfAbsent(structureCode, code -> {
            String label = structureService.getLabel(code);
            return label != null ? label : "Structure " + code;
        });
    }

    private String getString(Map<String, Object> record, String key) {
        Object val = record.get(key);
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private String buildExpectedValueDescription(List<RuleCondition> conditions) {
        List<String> descriptions = new ArrayList<>();
        for (RuleCondition condition : conditions) {
            String desc = switch (condition.getType().toLowerCase()) {
                case "required" -> "obligatoire";
                case "minlength" -> "min " + condition.getIntValue() + " caracteres";
                case "maxlength" -> "max " + condition.getIntValue() + " caracteres";
                case "alphanumeric" -> "alphanumerique";
                case "numericonly" -> "chiffres uniquement";
                case "forbiddenpatterns" -> "sans " + String.join(", ", condition.getValues());
                case "inlist" -> "parmi " + String.join(", ", condition.getValues());
                case "startswith" -> "commence par " + condition.getStringValue();
                case "datenotfuture" -> "date <= aujourd'hui";
                case "datenotexpired" -> "date >= aujourd'hui";
                case "dateafter" -> "date >= " + condition.getStringValue();
                case "notplaceholder" -> "pas de donnees fictives";
                default -> condition.getType();
            };
            descriptions.add(desc);
        }
        return String.join("; ", descriptions);
    }

    public record ValidationFailure(
            String fieldName, String fieldLabel, String currentValue,
            String expectedValue, String errorType, String errorMessage,
            String severity
    ) {}

    public record ValidationResult(
            int recordsValidated, int anomaliesCreated, int autoResolved,
            int duplicatesSkipped, int errors
    ) {}
}
