package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.Agency;
import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.Client;
import com.bsic.dataqualitybackend.model.RuleCondition;
import com.bsic.dataqualitybackend.model.ValidationRule;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.repository.AgencyRepository;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.ValidationRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.*;

/**
 * Service for validating clients against validation rules and creating anomalies.
 * Called after sync to detect data quality issues.
 * Uses natural language rule definitions (JSON format).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ClientValidationService {

    private final ValidationRuleRepository validationRuleRepository;
    private final AnomalyRepository anomalyRepository;
    private final AgencyRepository agencyRepository;
    private final NaturalLanguageRuleParser naturalLanguageRuleParser;
    private final AnomalyWorkflowService anomalyWorkflowService;

    // Field label mappings for user-friendly display
    private static final Map<String, String> FIELD_LABELS = Map.ofEntries(
            Map.entry("nom", "Nom"),
            Map.entry("pre", "Prenom"),
            Map.entry("nid", "Numero d'identite"),
            Map.entry("dna", "Date de naissance"),
            Map.entry("nat", "Nationalite"),
            Map.entry("sext", "Sexe"),
            Map.entry("viln", "Ville de naissance"),
            Map.entry("payn", "Pays de naissance"),
            Map.entry("tid", "Type de piece d'identite"),
            Map.entry("vid", "Date validite piece"),
            Map.entry("nrc", "Numero Registre Commerce"),
            Map.entry("rso", "Raison sociale"),
            Map.entry("fju", "Forme juridique"),
            Map.entry("datc", "Date de creation"),
            Map.entry("age", "Code agence"),
            Map.entry("nmer", "Nom de la mere"),
            Map.entry("sig", "Sigle"),
            Map.entry("cli", "Code client"),
            Map.entry("tcli", "Type client"),
            Map.entry("sec", "Secteur d'activite"),
            Map.entry("catn", "Categorie Banque Centrale"),
            Map.entry("lienbq", "Lien avec la banque")
    );

    /**
     * Validate a list of clients and create anomalies for validation failures.
     *
     * @param clients List of clients to validate
     * @return ValidationResult with statistics
     */
    @Transactional
    public ValidationResult validateClientsAndCreateAnomalies(List<Client> clients) {
        log.info("Starting validation for {} clients", clients.size());

        int totalAnomalies = 0;
        int skippedDuplicates = 0;
        int errors = 0;

        // Load all active rules once
        List<ValidationRule> allActiveRules = validationRuleRepository.findByActiveOrderByPriorityDesc(true);
        log.info("Loaded {} active validation rules", allActiveRules.size());

        // Cache agency names
        Map<String, String> agencyNames = new HashMap<>();

        for (Client client : clients) {
            try {
                // Determine client type
                ClientType clientType = getClientType(client.getTcli());
                if (clientType == null) {
                    log.warn("Unknown client type for client {}: tcli={}", client.getCli(), client.getTcli());
                    continue;
                }

                // Get applicable rules for this client type
                List<ValidationRule> applicableRules = getApplicableRules(allActiveRules, clientType);

                // Get agency name
                String agencyName = getAgencyName(client.getAge(), agencyNames);

                // Validate against each rule
                for (ValidationRule rule : applicableRules) {
                    try {
                        ValidationFailure failure = validateClientAgainstRule(client, rule);

                        if (failure != null) {
                            // Check if anomaly already exists
                            boolean exists = anomalyRepository.existsOpenAnomalyForClientAndField(
                                    client.getCli(), rule.getFieldName());

                            if (exists) {
                                skippedDuplicates++;
                                continue;
                            }

                            // Create anomaly
                            Anomaly anomaly = createAnomaly(client, rule, failure, clientType, agencyName);
                            Anomaly savedAnomaly = anomalyRepository.save(anomaly);
                            totalAnomalies++;

                            // Start BPMN workflow to create ticket
                            try {
                                anomalyWorkflowService.startWorkflowForAnomaly(savedAnomaly, "SYSTEM");
                                log.debug("Workflow started for anomaly {}", savedAnomaly.getId());
                            } catch (Exception we) {
                                log.warn("Failed to start workflow for anomaly {}: {}",
                                        savedAnomaly.getId(), we.getMessage());
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error validating rule {} for client {}: {}",
                                rule.getRuleName(), client.getCli(), e.getMessage());
                        errors++;
                    }
                }
            } catch (Exception e) {
                log.error("Error validating client {}: {}", client.getCli(), e.getMessage());
                errors++;
            }
        }

        log.info("Validation completed. Created: {}, Skipped duplicates: {}, Errors: {}",
                totalAnomalies, skippedDuplicates, errors);

        return new ValidationResult(clients.size(), totalAnomalies, skippedDuplicates, errors);
    }

    /**
     * Validate a single client and return list of failures (without saving).
     */
    public List<ValidationFailure> validateClient(Client client) {
        List<ValidationFailure> failures = new ArrayList<>();

        ClientType clientType = getClientType(client.getTcli());
        if (clientType == null) {
            return failures;
        }

        List<ValidationRule> allActiveRules = validationRuleRepository.findByActiveOrderByPriorityDesc(true);
        List<ValidationRule> applicableRules = getApplicableRules(allActiveRules, clientType);

        for (ValidationRule rule : applicableRules) {
            ValidationFailure failure = validateClientAgainstRule(client, rule);
            if (failure != null) {
                failures.add(failure);
            }
        }

        return failures;
    }

    /**
     * Get client type enum from tcli code.
     */
    private ClientType getClientType(String tcli) {
        if (tcli == null || tcli.isBlank()) {
            return null;
        }
        try {
            return ClientType.fromCode(tcli.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Filter rules applicable to a specific client type.
     * Includes rules with null clientType (apply to all) and specific type.
     */
    private List<ValidationRule> getApplicableRules(List<ValidationRule> allRules, ClientType clientType) {
        return allRules.stream()
                .filter(rule -> rule.getClientType() == null || rule.getClientType() == clientType)
                .toList();
    }

    /**
     * Validate a client against a single rule using natural language format.
     * Returns ValidationFailure if validation fails, null if passes.
     */
    private ValidationFailure validateClientAgainstRule(Client client, ValidationRule rule) {
        // Skip rules without valid definition
        if (!rule.hasValidRuleDefinition()) {
            log.debug("Skipping rule {} - no valid rule definition", rule.getRuleName());
            return null;
        }

        String fieldName = rule.getFieldName();
        Object fieldValue = getFieldValue(client, fieldName);
        String stringValue = fieldValue != null ? fieldValue.toString().trim() : null;

        List<RuleCondition> conditions = rule.parseRuleConditions();
        if (conditions.isEmpty()) {
            return null; // No conditions = pass
        }

        // Validate against all conditions
        NaturalLanguageRuleParser.ValidationResult result =
                naturalLanguageRuleParser.validateAll(fieldValue, conditions);

        if (!result.isValid()) {
            String fieldLabel = rule.getFieldLabel() != null ?
                    rule.getFieldLabel() :
                    FIELD_LABELS.getOrDefault(rule.getFieldName(), rule.getFieldName());

            return new ValidationFailure(
                    rule.getFieldName(),
                    fieldLabel,
                    stringValue,
                    buildExpectedValueDescription(conditions),
                    rule.getRuleType() != null ? rule.getRuleType().name() : "VALIDATION",
                    result.message() != null ? result.message() : rule.getErrorMessage(),
                    rule.getSeverity()
            );
        }

        return null;
    }

    /**
     * Build a human-readable description of expected value from conditions.
     */
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

    /**
     * Get field value from client using reflection.
     */
    private Object getFieldValue(Client client, String fieldName) {
        try {
            Field field = Client.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(client);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            log.warn("Cannot access field {} on Client", fieldName);
            return null;
        }
    }

    /**
     * Get agency name from cache or database.
     */
    private String getAgencyName(String agencyCode, Map<String, String> cache) {
        if (agencyCode == null || agencyCode.isBlank()) {
            return "Unknown";
        }

        return cache.computeIfAbsent(agencyCode, code ->
                agencyRepository.findByAge(code)
                        .map(Agency::getLib)
                        .orElse("Agence " + code)
        );
    }

    /**
     * Create an Anomaly entity from validation failure.
     */
    private Anomaly createAnomaly(Client client, ValidationRule rule, ValidationFailure failure,
                                   ClientType clientType, String agencyName) {
        String clientName = buildClientName(client, clientType);

        return Anomaly.builder()
                .clientNumber(client.getCli())
                .clientName(clientName)
                .clientType(clientType)
                .agencyCode(client.getAge() != null ? client.getAge() : "00000")
                .agencyName(agencyName)
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
     * Build client display name based on type.
     */
    private String buildClientName(Client client, ClientType clientType) {
        if (clientType == ClientType.CORPORATE || clientType == ClientType.INSTITUTIONAL) {
            return client.getRso() != null ? client.getRso() : client.getNom();
        }
        // Individual
        String nom = client.getNom() != null ? client.getNom() : "";
        String pre = client.getPre() != null ? client.getPre() : "";
        return (nom + " " + pre).trim();
    }

    /**
     * Record for validation failures.
     */
    public record ValidationFailure(
            String fieldName,
            String fieldLabel,
            String currentValue,
            String expectedValue,
            String errorType,
            String errorMessage,
            String severity
    ) {}

    /**
     * Record for validation results.
     */
    public record ValidationResult(
            int clientsValidated,
            int anomaliesCreated,
            int duplicatesSkipped,
            int errors
    ) {}
}
