package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.repository.InformixRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class ReconciliationService {

    private final InformixRepository informixRepository;

    @Qualifier("primaryJdbcTemplate")
    private final JdbcTemplate mysqlJdbcTemplate;

    public Map<String, Object> reconcileTask(String taskId) {
        log.info("Starting reconciliation for task: {}", taskId);

        Map<String, Object> task = getTask(taskId);
        if (task == null) {
            throw new RuntimeException("Task not found: " + taskId);
        }

        String clientId = (String) task.get("client_id");
        String ticketId = (String) task.get("ticket_id");

        Map<String, Object> cbsData = informixRepository.getClientById(clientId);
        if (cbsData == null || cbsData.isEmpty()) {
            throw new RuntimeException("Client not found in CBS: " + clientId);
        }

        List<Map<String, Object>> corrections = getCorrections(ticketId);
        List<Map<String, Object>> discrepancies = new ArrayList<>();
        int matchedFields = 0;

        for (Map<String, Object> correction : corrections) {
            String field = (String) correction.get("field_name");
            String expectedValue = (String) correction.get("new_value");
            String cbsColumn = mapFieldToCBSColumn(field);
            Object cbsValueObj = cbsData.get(cbsColumn);
            String cbsValue = cbsValueObj != null ? cbsValueObj.toString().trim() : "";

            boolean isMatched = compareValues(expectedValue, cbsValue);

            if (isMatched) {
                matchedFields++;
            } else {
                Map<String, Object> discrepancy = new HashMap<>();
                discrepancy.put("field", field);
                discrepancy.put("field_label", correction.get("field_label"));
                discrepancy.put("expected_value", expectedValue);
                discrepancy.put("actual_value", cbsValue);
                discrepancy.put("severity", calculateSeverity(field));
                discrepancies.add(discrepancy);
            }

            updateCorrectionStatus(ticketId, field, cbsValue, isMatched);
        }

        int totalFields = corrections.size();
        String status = matchedFields == totalFields ? "reconciled"
                : matchedFields > 0 ? "partial"
                : "failed";

        updateTaskStatus(taskId, status);

        Map<String, Object> result = new HashMap<>();
        result.put("task_id", taskId);
        result.put("status", "reconciled".equals(status) ? "success" : status);
        result.put("matched_fields", matchedFields);
        result.put("total_fields", totalFields);
        result.put("discrepancies", discrepancies);
        result.put("checked_at", LocalDateTime.now().toString());

        log.info("Reconciliation completed for task {}: {}/{} fields matched",
                taskId, matchedFields, totalFields);

        return result;
    }

    public List<Map<String, Object>> getPendingTasks(String agencyCode, String clientId) {
        StringBuilder sql = new StringBuilder("""
            SELECT DISTINCT
                t.id, t.ticket_id, t.client_id, t.status, t.created_at,
                t.attempts, t.last_attempt_at, t.error_message,
                a.client_name, a.agency_code
            FROM reconciliation_tasks t
            LEFT JOIN tickets tk ON tk.ticket_number = t.ticket_id
            LEFT JOIN anomalies a ON a.id = tk.anomaly_id
            WHERE t.status = 'pending'
        """);

        List<Object> params = new ArrayList<>();

        if (agencyCode != null && !agencyCode.isEmpty()) {
            sql.append(" AND a.agency_code = ?");
            params.add(agencyCode);
        }

        if (clientId != null && !clientId.isEmpty()) {
            sql.append(" AND t.client_id = ?");
            params.add(clientId);
        }

        sql.append(" ORDER BY t.created_at DESC LIMIT 100");

        List<Map<String, Object>> tasks = mysqlJdbcTemplate.queryForList(
                sql.toString(),
                params.toArray()
        );

        for (Map<String, Object> task : tasks) {
            String ticketId = (String) task.get("ticket_id");
            List<Map<String, Object>> corrections = getCorrections(ticketId);
            task.put("corrections", corrections);
        }

        return tasks;
    }

    public List<Map<String, Object>> getReconciliationHistory(
            String ticketId, String clientId, String status,
            LocalDateTime startDate, LocalDateTime endDate) {

        StringBuilder sql = new StringBuilder("""
            SELECT DISTINCT
                t.id, t.ticket_id, t.client_id, t.status, t.created_at,
                t.reconciled_at, t.attempts, t.last_attempt_at, t.error_message,
                a.client_name, a.agency_code
            FROM reconciliation_tasks t
            LEFT JOIN tickets tk ON tk.ticket_number = t.ticket_id
            LEFT JOIN anomalies a ON a.id = tk.anomaly_id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (ticketId != null && !ticketId.isEmpty()) {
            sql.append(" AND t.ticket_id = ?");
            params.add(ticketId);
        }

        if (clientId != null && !clientId.isEmpty()) {
            sql.append(" AND t.client_id = ?");
            params.add(clientId);
        }

        if (status != null && !status.isEmpty()) {
            sql.append(" AND t.status = ?");
            params.add(status);
        }

        if (startDate != null) {
            sql.append(" AND t.created_at >= ?");
            params.add(startDate);
        }

        if (endDate != null) {
            sql.append(" AND t.created_at <= ?");
            params.add(endDate);
        }

        sql.append(" ORDER BY t.created_at DESC LIMIT 500");

        List<Map<String, Object>> tasks = mysqlJdbcTemplate.queryForList(
                sql.toString(),
                params.toArray()
        );

        for (Map<String, Object> task : tasks) {
            String tktId = (String) task.get("ticket_id");
            List<Map<String, Object>> corrections = getCorrections(tktId);
            task.put("corrections", corrections);
        }

        return tasks;
    }

    public Map<String, Object> getStats(String agencyCode) {
        String whereClause = agencyCode != null && !agencyCode.isEmpty()
                ? "WHERE a.agency_code = ?"
                : "WHERE 1=1";

        String sql = String.format("""
            SELECT
                COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as total_pending,
                COUNT(CASE WHEN t.status = 'reconciled' AND DATE(t.reconciled_at) = CURDATE() THEN 1 END) as reconciled_today,
                COUNT(CASE WHEN t.status = 'failed' AND DATE(t.last_attempt_at) = CURDATE() THEN 1 END) as failed_today,
                ROUND(
                    COUNT(CASE WHEN t.status = 'reconciled' THEN 1 END) * 100.0 /
                    NULLIF(COUNT(*), 0), 2
                ) as success_rate,
                AVG(TIMESTAMPDIFF(SECOND, t.created_at, t.reconciled_at)) as average_reconciliation_time
            FROM reconciliation_tasks t
            LEFT JOIN tickets tk ON tk.ticket_number = t.ticket_id
            LEFT JOIN anomalies a ON a.id = tk.anomaly_id
            %s
        """, whereClause);

        Map<String, Object> stats = agencyCode != null && !agencyCode.isEmpty()
                ? mysqlJdbcTemplate.queryForMap(sql, agencyCode)
                : mysqlJdbcTemplate.queryForMap(sql);

        String statusSql = String.format("""
            SELECT t.status, COUNT(*) as count
            FROM reconciliation_tasks t
            LEFT JOIN tickets tk ON tk.ticket_number = t.ticket_id
            LEFT JOIN anomalies a ON a.id = tk.anomaly_id
            %s
            GROUP BY t.status
        """, whereClause);

        List<Map<String, Object>> byStatus = agencyCode != null && !agencyCode.isEmpty()
                ? mysqlJdbcTemplate.queryForList(statusSql, agencyCode)
                : mysqlJdbcTemplate.queryForList(statusSql);

        stats.put("by_status", byStatus);
        return stats;
    }

    public Map<String, Object> reconcileAll(String agencyCode, Integer maxTasks) {
        int limit = maxTasks != null ? maxTasks : 50;
        List<Map<String, Object>> tasks = getPendingTasks(agencyCode, null)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());

        int success = 0;
        int failed = 0;

        for (Map<String, Object> task : tasks) {
            try {
                String taskId = (String) task.get("id");
                Map<String, Object> result = reconcileTask(taskId);
                if ("success".equals(result.get("status"))) {
                    success++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                log.error("Error reconciling task: {}", e.getMessage());
                failed++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("failed", failed);
        result.put("total", tasks.size());

        return result;
    }

    private Map<String, Object> getTask(String taskId) {
        String sql = """
            SELECT t.id, t.ticket_id, t.client_id, t.status, t.created_at, t.attempts,
                   a.client_name
            FROM reconciliation_tasks t
            LEFT JOIN tickets tk ON tk.ticket_number = t.ticket_id
            LEFT JOIN anomalies a ON a.id = tk.anomaly_id
            WHERE t.id = ?
        """;

        try {
            return mysqlJdbcTemplate.queryForMap(sql, taskId);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Map<String, Object>> getCorrections(String ticketId) {
        String sql = """
            SELECT field_name, field_label, old_value, new_value,
                   cbs_value, is_matched, last_checked_at
            FROM corrections
            WHERE ticket_id = ?
        """;

        return mysqlJdbcTemplate.queryForList(sql, ticketId);
    }

    private void updateCorrectionStatus(String ticketId, String field, String cbsValue, boolean isMatched) {
        String sql = """
            UPDATE corrections
            SET cbs_value = ?, is_matched = ?, last_checked_at = NOW()
            WHERE ticket_id = ? AND field_name = ?
        """;

        mysqlJdbcTemplate.update(sql, cbsValue, isMatched, ticketId, field);
    }

    private void updateTaskStatus(String taskId, String status) {
        String sql = """
            UPDATE reconciliation_tasks
            SET status = ?, last_attempt_at = NOW(), attempts = attempts + 1,
                reconciled_at = CASE WHEN ? = 'reconciled' THEN NOW() ELSE reconciled_at END
            WHERE id = ?
        """;

        mysqlJdbcTemplate.update(sql, status, status, taskId);
    }

    private String mapFieldToCBSColumn(String field) {
        Map<String, String> fieldMapping = Map.ofEntries(
                Map.entry("name", "name"),
                Map.entry("firstname", "firstname"),
                Map.entry("address", "address"),
                Map.entry("city", "city"),
                Map.entry("postal_code", "postal_code"),
                Map.entry("phone", "phone"),
                Map.entry("email", "email"),
                Map.entry("birth_date", "birth_date"),
                Map.entry("nationality", "nationality"),
                Map.entry("client_type", "client_type"),
                Map.entry("fatca_status", "fatca_status")
        );

        return fieldMapping.getOrDefault(field, field);
    }

    private boolean compareValues(String expected, String actual) {
        String normalizedExpected = normalizeValue(expected);
        String normalizedActual = normalizeValue(actual);
        return normalizedExpected.equals(normalizedActual);
    }

    private String normalizeValue(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase();
    }

    private String calculateSeverity(String field) {
        List<String> criticalFields = List.of("client_id", "tax_id", "nationality");
        if (criticalFields.contains(field)) return "high";

        List<String> mediumFields = List.of("name", "firstname", "address", "phone", "email");
        if (mediumFields.contains(field)) return "medium";

        return "low";
    }
}
