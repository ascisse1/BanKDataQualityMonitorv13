package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.service.CbsColumnRegistry;
import com.bsic.dataqualitybackend.service.DynamicCbsQueryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Repository for accessing Informix CBS data.
 * Delegates dictionary-driven queries to DynamicCbsQueryService.
 * Keeps business-specific queries (FATCA, anomalous, statistics) that have custom SQL.
 */
@Repository
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class InformixRepository {

    private final JdbcTemplate informixJdbcTemplate;
    private final CbsColumnRegistry cbsColumnRegistry;
    private final DynamicCbsQueryService dynamicCbsQueryService;

    public InformixRepository(@Qualifier("informixJdbcTemplate") JdbcTemplate informixJdbcTemplate,
                              CbsColumnRegistry cbsColumnRegistry,
                              DynamicCbsQueryService dynamicCbsQueryService) {
        this.informixJdbcTemplate = informixJdbcTemplate;
        this.cbsColumnRegistry = cbsColumnRegistry;
        this.dynamicCbsQueryService = dynamicCbsQueryService;
    }

    public boolean testConnection() {
        try {
            Integer result = informixJdbcTemplate.queryForObject(
                    "SELECT FIRST 1 1 FROM systables", Integer.class);
            log.info("Informix connection test successful");
            return result != null;
        } catch (Exception e) {
            log.error("Informix connection test failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fetches specific fields for a client from CBS.
     * Delegates to DynamicCbsQueryService for dictionary-driven field access.
     */
    public Map<String, Object> getClientFields(String clientId, Set<String> fields) {
        if (fields == null || fields.isEmpty()) {
            return Collections.emptyMap();
        }
        return dynamicCbsQueryService.fetchFieldsFromCbs("bkcli", "cli", clientId, fields);
    }

    /**
     * Fetch a single client by ID. Dictionary-driven column list.
     */
    public Map<String, Object> getClientById(String clientId) {
        return dynamicCbsQueryService.fetchByPk("bkcli", Map.of("cli", clientId));
    }

    /**
     * Fetch clients in batches. Dictionary-driven column list.
     */
    public List<Map<String, Object>> getClientsBatch(int offset, int limit) {
        return dynamicCbsQueryService.fetchFromCbs("bkcli", offset, limit);
    }

    /**
     * Search clients by name or ID (business-specific SQL).
     */
    public List<Map<String, Object>> searchClients(String searchTerm, int limit) {
        String sql = """
            SELECT FIRST ?
                cli, nom, pre, tcli, age
            FROM bkcli
            WHERE nom LIKE ? OR pre LIKE ? OR cli LIKE ?
            ORDER BY nom, pre
        """;
        String pattern = "%" + searchTerm + "%";
        return informixJdbcTemplate.queryForList(sql, limit, pattern, pattern, pattern);
    }

    public Long getTotalClientsCount() {
        return dynamicCbsQueryService.countCbsRecords("bkcli");
    }

    /**
     * Client statistics by type (business-specific aggregation).
     */
    public Map<String, Long> getClientStatistics() {
        String sql = "SELECT tcli as client_type, COUNT(*) as count FROM bkcli GROUP BY tcli";
        List<Map<String, Object>> results = informixJdbcTemplate.queryForList(sql);
        return results.stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> String.valueOf(row.get("client_type")),
                        row -> ((Number) row.get("count")).longValue()
                ));
    }

    /**
     * Find clients with anomalous data (business-specific SQL).
     */
    public List<Map<String, Object>> getAnomalousClients(int limit) {
        String sql = """
            SELECT FIRST ?
                cli, nom, pre, tcli,
                CASE
                    WHEN nom IS NULL OR TRIM(nom) = '' THEN 'Nom manquant'
                    WHEN pre IS NULL OR TRIM(pre) = '' THEN 'Prenom manquant'
                    ELSE 'Autre anomalie'
                END as anomaly_type
            FROM bkcli
            WHERE nom IS NULL OR TRIM(nom) = '' OR pre IS NULL OR TRIM(pre) = ''
            ORDER BY cli
        """;
        return informixJdbcTemplate.queryForList(sql, limit);
    }

    /**
     * Update client in CBS. Delegates to DynamicCbsQueryService.
     */
    public boolean updateClient(String clientId, Map<String, Object> updates) {
        return dynamicCbsQueryService.updateCbsRecord("bkcli", "cli", clientId, updates);
    }

    public Map<String, Object> executeCustomQuery(String sql, Object... params) {
        try {
            return informixJdbcTemplate.queryForMap(sql, params);
        } catch (Exception e) {
            log.error("Error executing custom query: {}", e.getMessage());
            throw new RuntimeException("Query execution failed", e);
        }
    }

    public List<Map<String, Object>> executeCustomQueryList(String sql, Object... params) {
        try {
            return informixJdbcTemplate.queryForList(sql, params);
        } catch (Exception e) {
            log.error("Error executing custom query: {}", e.getMessage());
            throw new RuntimeException("Query execution failed", e);
        }
    }
}
