package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.Anomaly;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service to start BPMN workflow for anomaly processing.
 * Triggers the ticket-correction-process workflow when anomalies are detected.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyWorkflowService {

    private static final String WORKFLOW_PROCESS_KEY = "ticket-correction-process";

    private final RuntimeService runtimeService;
    private final RepositoryService repositoryService;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("=== AnomalyWorkflowService - Checking BPMN Deployment ===");
        log.info(getProcessDeploymentInfo());
        if (!isProcessDeployed()) {
            log.error("WARNING: BPMN process '{}' is NOT deployed! Tickets will NOT be created automatically.", WORKFLOW_PROCESS_KEY);
        }
    }

    /**
     * Start the ticket correction workflow for a detected anomaly.
     *
     * @param anomaly The detected anomaly
     * @param initiatorUsername The username of the user/system that detected the anomaly
     * @return Process instance ID
     */
    public String startWorkflowForAnomaly(Anomaly anomaly, String initiatorUsername) {
        log.info("Starting workflow for anomaly {} - client: {}, field: {}",
                anomaly.getId(), anomaly.getClientNumber(), anomaly.getFieldName());

        Map<String, Object> variables = new HashMap<>();

        // Core identifiers
        variables.put("anomalyId", anomaly.getId());
        variables.put("clientId", anomaly.getClientNumber());
        variables.put("structureCode", anomaly.getStructureCode());

        // Priority based on severity
        String priority = mapSeverityToPriority(anomaly.getSeverity());
        variables.put("priority", priority);

        // Initiator for audit trail
        variables.put("initiator", initiatorUsername != null ? initiatorUsername : "SYSTEM");

        // Anomaly details for workflow tasks
        variables.put("fieldName", anomaly.getFieldName());
        variables.put("fieldLabel", anomaly.getFieldLabel());
        variables.put("currentValue", anomaly.getCurrentValue());
        variables.put("expectedValue", anomaly.getExpectedValue());
        variables.put("errorMessage", anomaly.getErrorMessage());
        variables.put("errorType", anomaly.getErrorType());
        variables.put("assignedUserId", initiatorUsername != null ? initiatorUsername : "admin");
        variables.put("clientName", anomaly.getClientName());
        variables.put("clientType", anomaly.getClientType() != null ? anomaly.getClientType().name() : null);
        variables.put("severity", anomaly.getSeverity() != null ? anomaly.getSeverity() : "medium");

        // Check if process definition is deployed
        ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(WORKFLOW_PROCESS_KEY)
                .latestVersion()
                .singleResult();

        if (processDefinition == null) {
            log.error("Process definition '{}' not found! Make sure the BPMN file is deployed.", WORKFLOW_PROCESS_KEY);
            throw new RuntimeException("Process definition not found: " + WORKFLOW_PROCESS_KEY);
        }

        log.debug("Found process definition: {} (version {})", processDefinition.getId(), processDefinition.getVersion());

        try {
            ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
                    WORKFLOW_PROCESS_KEY,
                    "ANOMALY-" + anomaly.getId(),
                    variables
            );

            String processInstanceId = processInstance.getProcessInstanceId();
            log.info("Workflow started successfully - processInstanceId: {}, anomalyId: {}, ticketWillBeCreated: true",
                    processInstanceId, anomaly.getId());

            return processInstanceId;
        } catch (Exception e) {
            log.error("Failed to start workflow for anomaly {}: {}", anomaly.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to start anomaly workflow: " + e.getMessage(), e);
        }
    }

    /**
     * Start workflow for multiple anomalies (batch processing).
     */
    public Map<Long, String> startWorkflowForAnomalies(Iterable<Anomaly> anomalies, String initiatorUsername) {
        Map<Long, String> results = new HashMap<>();

        for (Anomaly anomaly : anomalies) {
            try {
                String processInstanceId = startWorkflowForAnomaly(anomaly, initiatorUsername);
                results.put(anomaly.getId(), processInstanceId);
            } catch (Exception e) {
                log.error("Failed to start workflow for anomaly {}: {}", anomaly.getId(), e.getMessage());
                results.put(anomaly.getId(), null);
            }
        }

        return results;
    }

    /**
     * Check if the workflow process is deployed.
     */
    public boolean isProcessDeployed() {
        ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(WORKFLOW_PROCESS_KEY)
                .latestVersion()
                .singleResult();
        return processDefinition != null;
    }

    /**
     * Get deployment info for logging/debugging.
     */
    public String getProcessDeploymentInfo() {
        ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(WORKFLOW_PROCESS_KEY)
                .latestVersion()
                .singleResult();

        if (processDefinition == null) {
            return "Process '" + WORKFLOW_PROCESS_KEY + "' NOT DEPLOYED";
        }

        return String.format("Process '%s' deployed: id=%s, version=%d, deploymentId=%s",
                WORKFLOW_PROCESS_KEY,
                processDefinition.getId(),
                processDefinition.getVersion(),
                processDefinition.getDeploymentId());
    }

    private String mapSeverityToPriority(String severity) {
        if (severity == null) {
            return "MEDIUM";
        }

        return switch (severity.toLowerCase()) {
            case "critical" -> "CRITICAL";
            case "high" -> "HIGH";
            case "medium" -> "MEDIUM";
            case "low" -> "LOW";
            default -> "MEDIUM";
        };
    }

    /**
     * Check if a workflow is already running for an anomaly.
     */
    public boolean isWorkflowActiveForAnomaly(Long anomalyId) {
        long count = runtimeService.createProcessInstanceQuery()
                .processInstanceBusinessKey("ANOMALY-" + anomalyId)
                .active()
                .count();
        return count > 0;
    }

    /**
     * Get the process instance ID for an anomaly's workflow.
     */
    public String getProcessInstanceIdForAnomaly(Long anomalyId) {
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceBusinessKey("ANOMALY-" + anomalyId)
                .active()
                .singleResult();
        return instance != null ? instance.getProcessInstanceId() : null;
    }
}
