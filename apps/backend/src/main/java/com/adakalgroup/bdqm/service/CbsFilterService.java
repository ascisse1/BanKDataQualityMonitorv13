package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.CbsFieldDto;
import com.adakalgroup.bdqm.model.CbsTableFilter;
import com.adakalgroup.bdqm.model.enums.CbsFilterOperator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CbsFilterService {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern SAFE_VALUE_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-. ]+$");
    private static final int MAX_VALUE_LENGTH = 255;

    private final CbsDataDictionaryService dictionaryService;

    public CbsFilterService(CbsDataDictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    /**
     * Parse data_filters JSON string into a list of CbsTableFilter objects.
     */
    public List<CbsTableFilter> parseFilters(String dataFiltersJson) {
        if (dataFiltersJson == null || dataFiltersJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(dataFiltersJson, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse data_filters JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Validate all filters for a table against the data dictionary.
     * Throws IllegalArgumentException if any column is not in the dictionary or operator is invalid.
     */
    public void validateFilters(String tableName, List<CbsTableFilter> filters) {
        Set<String> allowedColumns = dictionaryService.getFieldsByTableName(tableName)
                .stream()
                .map(f -> f.getColumnName().toLowerCase())
                .collect(Collectors.toSet());

        for (CbsTableFilter filter : filters) {
            if (filter.getColumn() == null || filter.getColumn().isBlank()) {
                throw new IllegalArgumentException("Filter column name is required");
            }
            if (!allowedColumns.contains(filter.getColumn().toLowerCase())) {
                throw new IllegalArgumentException(
                        "Filter column '" + filter.getColumn() + "' not found in dictionary for table " + tableName);
            }

            CbsFilterOperator operator;
            try {
                operator = CbsFilterOperator.valueOf(filter.getOperator());
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid filter operator: " + filter.getOperator());
            }

            // Validate value presence based on operator
            switch (operator) {
                case EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN -> {
                    if (filter.getValue() == null || filter.getValue().isBlank()) {
                        throw new IllegalArgumentException(
                                "Value is required for operator " + operator + " on column " + filter.getColumn());
                    }
                    validateValue(filter.getValue());
                }
                case IN, NOT_IN -> {
                    if (filter.getValues() == null || filter.getValues().isEmpty()) {
                        throw new IllegalArgumentException(
                                "Values list is required for operator " + operator + " on column " + filter.getColumn());
                    }
                    filter.getValues().forEach(this::validateValue);
                }
                case IS_NULL, IS_NOT_NULL -> {
                    // No value needed
                }
            }
        }
    }

    /**
     * Build SQL WHERE conditions from a list of filters.
     * Returns empty list if no filters. Each entry is a safe SQL condition string.
     */
    public List<String> buildFilterConditions(String tableName, List<CbsTableFilter> filters) {
        if (filters == null || filters.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> conditions = new ArrayList<>();

        for (CbsTableFilter filter : filters) {
            CbsFilterOperator operator = CbsFilterOperator.valueOf(filter.getOperator());
            String col = filter.getColumn();

            String condition = switch (operator) {
                case EQUALS -> col + " = " + escapeValue(filter.getValue());
                case NOT_EQUALS -> col + " <> " + escapeValue(filter.getValue());
                case GREATER_THAN -> col + " > " + escapeValue(filter.getValue());
                case LESS_THAN -> col + " < " + escapeValue(filter.getValue());
                case IN -> col + " IN (" + escapeValues(filter.getValues()) + ")";
                case NOT_IN -> col + " NOT IN (" + escapeValues(filter.getValues()) + ")";
                case IS_NULL -> col + " IS NULL";
                case IS_NOT_NULL -> col + " IS NOT NULL";
            };

            conditions.add(condition);
        }

        return conditions;
    }

    /**
     * Build a complete WHERE clause string from table's data_filters JSON.
     * Returns empty string if no filters configured.
     */
    public String buildWhereClause(String tableName, String dataFiltersJson) {
        List<CbsTableFilter> filters = parseFilters(dataFiltersJson);
        if (filters.isEmpty()) {
            return "";
        }
        List<String> conditions = buildFilterConditions(tableName, filters);
        if (conditions.isEmpty()) {
            return "";
        }
        return String.join(" AND ", conditions);
    }

    private void validateValue(String value) {
        if (value == null) return;
        if (value.length() > MAX_VALUE_LENGTH) {
            throw new IllegalArgumentException("Filter value exceeds maximum length of " + MAX_VALUE_LENGTH);
        }
        if (!SAFE_VALUE_PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("Filter value contains invalid characters: " + value);
        }
    }

    private String escapeValue(String value) {
        String escaped = value.replace("'", "''");
        return "'" + escaped + "'";
    }

    private String escapeValues(List<String> values) {
        return values.stream()
                .map(this::escapeValue)
                .collect(Collectors.joining(", "));
    }
}
