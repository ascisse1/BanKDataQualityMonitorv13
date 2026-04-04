package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.service.DynamicCbsQueryService;
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
 * Fully dictionary-driven — all queries delegate to DynamicCbsQueryService.
 * No hardcoded table names or column references.
 */
@Repository
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class InformixRepository {

    private final JdbcTemplate informixJdbcTemplate;
    private final DynamicCbsQueryService dynamicCbsQueryService;

    public InformixRepository(@Qualifier("informixJdbcTemplate") JdbcTemplate informixJdbcTemplate,
                              DynamicCbsQueryService dynamicCbsQueryService) {
        this.informixJdbcTemplate = informixJdbcTemplate;
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
     * Fetches specific fields for a record from CBS.
     * Dictionary-driven: columns validated against cbs_fields metadata.
     */
    public Map<String, Object> getRecordFields(String tableName, String pkColumn, String pkValue, Set<String> fields) {
        if (fields == null || fields.isEmpty()) {
            return Collections.emptyMap();
        }
        return dynamicCbsQueryService.fetchFieldsFromCbs(tableName, pkColumn, pkValue, fields);
    }

    /**
     * Fetch a single record by primary key. Dictionary-driven column list.
     */
    public Map<String, Object> getRecordByPk(String tableName, Map<String, Object> pkValues) {
        return dynamicCbsQueryService.fetchByPk(tableName, pkValues);
    }

    /**
     * Fetch records in batches. Dictionary-driven column list.
     */
    public List<Map<String, Object>> getRecordsBatch(String tableName, int offset, int limit) {
        return dynamicCbsQueryService.fetchFromCbs(tableName, offset, limit);
    }

    /**
     * Count total records in a CBS table.
     */
    public long getRecordCount(String tableName) {
        return dynamicCbsQueryService.countCbsRecords(tableName);
    }

    /**
     * Update a record in CBS. Dictionary-driven column validation.
     */
    public boolean updateRecord(String tableName, String pkColumn, String pkValue, Map<String, Object> updates) {
        return dynamicCbsQueryService.updateCbsRecord(tableName, pkColumn, pkValue, updates);
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
