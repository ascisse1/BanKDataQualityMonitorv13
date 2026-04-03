package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.*;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReconciliationService {

    private static final int MAX_ATTEMPTS = 5;
    private static final List<String> ACTIVE_STATUSES = List.of("pending", "in_progress", "partial", "failed");

    private final ReconciliationTaskRepository taskRepository;
    private final CorrectionRepository correctionRepository;
    private final ReconciliationAttemptRepository attemptRepository;
    private final TicketRepository ticketRepository;
    private final AnomalyRepository anomalyRepository;

    @Autowired(required = false)
    private InformixRepository informixRepository;

    private final CbsColumnRegistry cbsColumnRegistry;

    // ──────────────────────────────────────────────
    //  Core reconciliation
    // ──────────────────────────────────────────────

    @Transactional
    public Map<String, Object> reconcileTask(String taskId) {
        long startTime = System.currentTimeMillis();
        Long id = Long.valueOf(taskId);

        ReconciliationTask task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (task.isTerminal()) {
            throw new RuntimeException("Task " + taskId + " is already " + task.getStatus());
        }

        if (informixRepository == null) {
            String error = "CBS integration is not enabled";
            task.markFailed(error);
            taskRepository.save(task);
            saveAttempt(task, "error", 0, 0, error, startTime);
            throw new RuntimeException(error);
        }

        if (task.getAttempts() >= MAX_ATTEMPTS) {
            task.markAbandoned("Nombre maximum de tentatives atteint (" + MAX_ATTEMPTS + ")");
            taskRepository.save(task);
            return Map.of("task_id", taskId, "status", "abandoned",
                    "message", "Max attempts reached. Task abandoned.");
        }

        // Mark in_progress
        task.setStatus("in_progress");
        taskRepository.save(task);

        try {
            List<Correction> corrections = correctionRepository.findByTicketIdAndIsMatchedFalse(task.getTicketId());

            if (corrections.isEmpty()) {
                task.markReconciled();
                taskRepository.save(task);
                saveAttempt(task, "reconciled", 0, 0, null, startTime);
                return Map.of("task_id", taskId, "status", "success",
                        "matched_fields", 0, "total_fields", 0);
            }

            Set<String> fieldsToCheck = corrections.stream()
                    .map(Correction::getFieldName)
                    .filter(cbsColumnRegistry::isAllowedColumn)
                    .collect(Collectors.toSet());

            Map<String, Object> cbsData = informixRepository.getClientFields(task.getClientId(), fieldsToCheck);

            if (cbsData == null || cbsData.isEmpty()) {
                String error = "Client not found in CBS: " + task.getClientId();
                task.markFailed(error);
                taskRepository.save(task);
                saveAttempt(task, "failed", 0, corrections.size(), error, startTime);
                return Map.of("task_id", taskId, "status", "failed", "error", error,
                        "matched_fields", 0, "total_fields", corrections.size());
            }

            List<Map<String, Object>> discrepancies = new ArrayList<>();
            int matchedFields = 0;

            for (Correction correction : corrections) {
                String cbsColumn = cbsColumnRegistry.toAlias(correction.getFieldName());
                Object cbsValueObj = cbsData.get(cbsColumn);
                String cbsValue = cbsValueObj != null ? cbsValueObj.toString().trim() : "";

                boolean isMatched = compareValues(correction.getNewValue(), cbsValue);

                if (isMatched) {
                    correction.markMatched(cbsValue);
                    matchedFields++;
                } else {
                    correction.markUnmatched(cbsValue);
                    Map<String, Object> discrepancy = new HashMap<>();
                    discrepancy.put("field", correction.getFieldName());
                    discrepancy.put("field_label", correction.getFieldLabel());
                    discrepancy.put("expected_value", correction.getNewValue());
                    discrepancy.put("actual_value", cbsValue);
                    discrepancy.put("severity", calculateSeverity(correction.getFieldName()));
                    discrepancies.add(discrepancy);
                }
            }

            correctionRepository.saveAll(corrections);

            int totalFields = corrections.size();
            String status;
            if (matchedFields == totalFields) {
                task.markReconciled();
                status = "reconciled";
            } else if (matchedFields > 0) {
                task.markPartial();
                status = "partial";
            } else {
                task.markFailed(null);
                status = "failed";
            }

            taskRepository.save(task);
            saveAttempt(task, status, matchedFields, totalFields, null, startTime);

            if ("reconciled".equals(status)) {
                closeTicketAfterReconciliation(task.getTicketId(), task.getClientId());
            }

            // Auto-abandon if max attempts reached
            if (!"reconciled".equals(status) && task.getAttempts() >= MAX_ATTEMPTS) {
                task.markAbandoned("Nombre maximum de tentatives atteint (" + MAX_ATTEMPTS
                        + ") — " + matchedFields + "/" + totalFields + " champs correspondent");
                taskRepository.save(task);
                status = "abandoned";
            }

            Map<String, Object> result = new HashMap<>();
            result.put("task_id", taskId);
            result.put("status", "reconciled".equals(status) ? "success" : status);
            result.put("matched_fields", matchedFields);
            result.put("total_fields", totalFields);
            result.put("discrepancies", discrepancies);
            result.put("checked_at", LocalDateTime.now().toString());

            log.info("Reconciliation completed for task {}: {}/{} fields matched (status: {})",
                    taskId, matchedFields, totalFields, status);
            return result;

        } catch (Exception e) {
            task.markFailed(e.getMessage());
            taskRepository.save(task);
            saveAttempt(task, "error", 0, 0, e.getMessage(), startTime);
            log.error("Reconciliation failed for task {}: {}", taskId, e.getMessage(), e);
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    //  Abandon + create new anomaly
    // ──────────────────────────────────────────────

    @Transactional
    public Map<String, Object> abandonAndCreateAnomaly(String taskId, String username) {
        Long id = Long.valueOf(taskId);
        ReconciliationTask task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if ("reconciled".equals(task.getStatus())) {
            throw new RuntimeException("Cannot abandon a reconciled task");
        }

        // Get ticket for structure_code and client_type
        Optional<Ticket> ticketOpt = ticketRepository.findByTicketNumber(task.getTicketId());
        String structureCode = ticketOpt.map(Ticket::getStructureCode).orElse("UNKNOWN");
        String clientTypeCode = ticketOpt.map(Ticket::getClientType).orElse("1");
        String clientName = ticketOpt.map(Ticket::getClientName).orElse(task.getClientId());

        // Abandon
        task.markAbandoned("Abandonné par " + username + " — nouvelle anomalie créée");
        taskRepository.save(task);

        // Create anomalies from unmatched corrections
        List<Correction> unmatchedCorrections = correctionRepository.findByTicketIdAndIsMatchedFalse(task.getTicketId());
        List<Long> createdAnomalyIds = new ArrayList<>();

        for (Correction correction : unmatchedCorrections) {
            Anomaly anomaly = Anomaly.builder()
                    .clientNumber(task.getClientId())
                    .clientName(clientName)
                    .clientType(ClientType.fromCode(clientTypeCode))
                    .structureCode(structureCode)
                    .fieldName(correction.getFieldName())
                    .fieldLabel(correction.getFieldLabel() != null ? correction.getFieldLabel() : correction.getFieldName())
                    .currentValue(correction.getCbsValue() != null ? correction.getCbsValue() : "")
                    .expectedValue(correction.getNewValue())
                    .errorType("RECONCILIATION_FAILURE")
                    .errorMessage("Échec réconciliation CBS — ticket " + task.getTicketId()
                            + " (attendu: " + correction.getNewValue() + ", CBS: " + correction.getCbsValue() + ")")
                    .severity(calculateSeverity(correction.getFieldName()))
                    .dataSource("RECONCILIATION")
                    .status(AnomalyStatus.PENDING)
                    .build();

            Anomaly saved = anomalyRepository.save(anomaly);
            createdAnomalyIds.add(saved.getId());
            log.info("Created anomaly {} for abandoned task {} field {}",
                    saved.getId(), taskId, correction.getFieldName());
        }

        return Map.of(
                "task_id", taskId,
                "status", "abandoned",
                "anomalies_created", createdAnomalyIds.size(),
                "anomaly_ids", createdAnomalyIds
        );
    }

    // ──────────────────────────────────────────────
    //  Queries
    // ──────────────────────────────────────────────

    public List<Map<String, Object>> getPendingTasks(String structureCode, String clientId) {
        List<ReconciliationTask> tasks = taskRepository.findByStatusInOrderByCreatedAtDesc(ACTIVE_STATUSES);

        return tasks.stream()
                .map(task -> {
                    enrichTaskFromTicket(task);
                    return task;
                })
                .filter(task -> structureCode == null || structureCode.isEmpty()
                        || structureCode.equals(task.getStructureCode()))
                .filter(task -> clientId == null || clientId.isEmpty()
                        || task.getClientId().equals(clientId))
                .limit(100)
                .map(this::taskToMap)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getReconciliationHistory(
            String ticketId, String clientId, String status,
            LocalDateTime startDate, LocalDateTime endDate) {

        List<ReconciliationTask> allTasks = taskRepository.findAll();

        return allTasks.stream()
                .filter(t -> ticketId == null || ticketId.isEmpty() || t.getTicketId().equals(ticketId))
                .filter(t -> clientId == null || clientId.isEmpty() || t.getClientId().equals(clientId))
                .filter(t -> status == null || status.isEmpty() || t.getStatus().equals(status))
                .filter(t -> startDate == null || !t.getCreatedAt().isBefore(startDate))
                .filter(t -> endDate == null || !t.getCreatedAt().isAfter(endDate))
                .sorted(Comparator.comparing(ReconciliationTask::getCreatedAt).reversed())
                .limit(500)
                .map(task -> {
                    enrichTaskFromTicket(task);
                    return taskToMap(task);
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStats(String structureCode) {
        long totalPending = taskRepository.countByStatusIn(ACTIVE_STATUSES);
        long reconciledToday = taskRepository.countReconciledToday();
        long failedToday = taskRepository.countFailedToday();
        long totalAbandoned = taskRepository.countAbandoned();
        long totalReconciled = taskRepository.countReconciled();
        long totalAll = taskRepository.countAll();

        double successRate = totalAll > 0 ? (totalReconciled * 100.0 / totalAll) : 0;

        List<Object[]> statusCounts = taskRepository.countByStatus();
        List<Map<String, Object>> byStatus = statusCounts.stream()
                .map(row -> Map.<String, Object>of("status", row[0], "count", row[1]))
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_pending", totalPending);
        stats.put("reconciled_today", reconciledToday);
        stats.put("failed_today", failedToday);
        stats.put("total_abandoned", totalAbandoned);
        stats.put("success_rate", Math.round(successRate * 100.0) / 100.0);
        stats.put("average_reconciliation_time", 0); // simplified — compute if needed
        stats.put("by_status", byStatus);

        return stats;
    }

    public List<ReconciliationAttempt> getAttempts(String taskId) {
        return attemptRepository.findByTaskIdOrderByAttemptNumber(Long.valueOf(taskId));
    }

    // ──────────────────────────────────────────────
    //  Batch reconciliation
    // ──────────────────────────────────────────────

    public Map<String, Object> reconcileAll(String structureCode, Integer maxTasks) {
        int limit = maxTasks != null ? maxTasks : 50;
        List<ReconciliationTask> tasks = taskRepository.findByStatusInOrderByCreatedAtDesc(ACTIVE_STATUSES)
                .stream().limit(limit).collect(Collectors.toList());

        int success = 0, failed = 0, abandoned = 0;

        for (ReconciliationTask task : tasks) {
            try {
                Map<String, Object> result = reconcileTask(String.valueOf(task.getId()));
                String resultStatus = (String) result.get("status");
                if ("success".equals(resultStatus)) success++;
                else if ("abandoned".equals(resultStatus)) abandoned++;
                else failed++;
            } catch (Exception e) {
                log.error("Error reconciling task {}: {}", task.getId(), e.getMessage());
                failed++;
            }
        }

        return Map.of("success", success, "failed", failed, "abandoned", abandoned, "total", tasks.size());
    }

    // ──────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────

    @Transactional
    private void closeTicketAfterReconciliation(String ticketNumber, String clientId) {
        try {
            Optional<Ticket> ticketOpt = ticketRepository.findByTicketNumber(ticketNumber);
            if (ticketOpt.isEmpty()) {
                log.warn("Ticket {} not found for post-reconciliation closure", ticketNumber);
                return;
            }

            Ticket ticket = ticketOpt.get();
            if (ticket.getStatus() != TicketStatus.UPDATED_CBS) {
                log.info("Ticket {} is in status {} — skipping closure", ticketNumber, ticket.getStatus());
                return;
            }

            ticket.setStatus(TicketStatus.CLOSED);
            ticket.setClosedAt(LocalDateTime.now());
            ticketRepository.save(ticket);

            List<Anomaly> openAnomalies = anomalyRepository.findByClientNumberAndStatusIn(
                    clientId, List.of(AnomalyStatus.CORRECTED, AnomalyStatus.IN_PROGRESS));
            for (Anomaly anomaly : openAnomalies) {
                anomaly.setStatus(AnomalyStatus.CLOSED);
            }
            anomalyRepository.saveAll(openAnomalies);

            log.info("Ticket {} and {} anomalies closed after reconciliation",
                    ticketNumber, openAnomalies.size());
        } catch (Exception e) {
            log.error("Failed to close ticket {}: {}", ticketNumber, e.getMessage(), e);
        }
    }

    private void enrichTaskFromTicket(ReconciliationTask task) {
        ticketRepository.findByTicketNumber(task.getTicketId()).ifPresent(ticket -> {
            task.setClientName(ticket.getClientName());
            task.setStructureCode(ticket.getStructureCode());
        });
    }

    private Map<String, Object> taskToMap(ReconciliationTask task) {
        List<Correction> corrections = correctionRepository.findByTicketId(task.getTicketId());

        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(task.getId()));
        map.put("ticket_id", task.getTicketId());
        map.put("client_id", task.getClientId());
        map.put("client_name", task.getClientName());
        map.put("structure_code", task.getStructureCode());
        map.put("status", task.getStatus());
        map.put("attempts", task.getAttempts());
        map.put("created_at", task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        map.put("reconciled_at", task.getReconciledAt() != null ? task.getReconciledAt().toString() : null);
        map.put("last_attempt_at", task.getLastAttemptAt() != null ? task.getLastAttemptAt().toString() : null);
        map.put("error_message", task.getErrorMessage());
        map.put("abandoned_at", task.getAbandonedAt() != null ? task.getAbandonedAt().toString() : null);
        map.put("abandoned_reason", task.getAbandonedReason());
        map.put("corrections", corrections.stream().map(c -> {
            Map<String, Object> cm = new HashMap<>();
            cm.put("field_name", c.getFieldName());
            cm.put("field_label", c.getFieldLabel());
            cm.put("old_value", c.getOldValue());
            cm.put("expected_value", c.getNewValue());
            cm.put("cbs_value", c.getCbsValue());
            cm.put("is_matched", c.getIsMatched());
            cm.put("last_checked_at", c.getLastCheckedAt() != null ? c.getLastCheckedAt().toString() : null);
            return cm;
        }).collect(Collectors.toList()));

        return map;
    }

    private void saveAttempt(ReconciliationTask task, String status,
                             int matchedFields, int totalFields, String error, long startTime) {
        ReconciliationAttempt attempt = ReconciliationAttempt.builder()
                .task(task)
                .attemptNumber(task.getAttempts())
                .status(status)
                .matchedFields(matchedFields)
                .totalFields(totalFields)
                .errorMessage(error)
                .durationMs(System.currentTimeMillis() - startTime)
                .build();
        attemptRepository.save(attempt);
    }

    private boolean compareValues(String expected, String actual) {
        return normalizeValue(expected).equals(normalizeValue(actual));
    }

    private String normalizeValue(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase();
    }

    private String calculateSeverity(String field) {
        if (List.of("client_id", "tax_id", "nationality", "nid", "nrc").contains(field)) return "high";
        if (List.of("name", "firstname", "address", "phone", "email", "nom", "pre").contains(field)) return "medium";
        return "low";
    }
}
