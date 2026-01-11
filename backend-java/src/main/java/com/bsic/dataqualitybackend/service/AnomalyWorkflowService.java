package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.Anomaly;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
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
        variables.put("agencyCode", anomaly.getAgencyCode());

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
        variables.put("clientName", anomaly.getClientName());
        variables.put("clientType", anomaly.getClientType() != null ? anomaly.getClientType().name() : null);
        variables.put("severity", anomaly.getSeverity() != null ? anomaly.getSeverity() : "medium");

        try {
            ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
                    WORKFLOW_PROCESS_KEY,
                    "ANOMALY-" + anomaly.getId(),  // Business key for correlation
                    variables
            );

            String processInstanceId = processInstance.getProcessInstanceId();
            log.info("Workflow started successfully - processInstanceId: {}, anomalyId: {}",
                    processInstanceId, anomaly.getId());

            return processInstanceId;
        } catch (Exception e) {
            log.error("Failed to start workflow for anomaly {}: {}", anomaly.getId(), e.getMessage());
            throw new RuntimeException("Failed to start anomaly workflow: " + e.getMessage(), e);
        }
    }

    /**
     * Start workflow for multiple anomalies (batch processing).
     * Each anomaly gets its own workflow instance.
     *
     * @param anomalies List of anomalies to process
     * @param initiatorUsername The username of the initiator
     * @return Map of anomaly ID to process instance ID
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
     * Map anomaly severity (low/medium/high/critical) to ticket priority.
     */
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
     *
     * @param anomalyId The anomaly ID
     * @return true if workflow is active
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
     *
     * @param anomalyId The anomaly ID
     * @return Process instance ID or null if not found
     */
    public String getProcessInstanceIdForAnomaly(Long anomalyId) {
        return runtimeService.createProcessInstanceQuery()
                .processInstanceBusinessKey("ANOMALY-" + anomalyId)
                .active()
                .singleResult()
                .getProcessInstanceId();
    }
}
