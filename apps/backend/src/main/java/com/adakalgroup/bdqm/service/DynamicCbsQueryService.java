package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.CbsFieldDto;
import com.adakalgroup.bdqm.dto.CbsTableDto;
import com.adakalgroup.bdqm.model.enums.CbsDataType;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.DataType;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.jooq.impl.SQLDataType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamic CBS query service powered by jOOQ.
 * Builds SQL queries from cbs_fields metadata — no hardcoded entities.
 * Manages CBS mirror table schemas and data sync.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class DynamicCbsQueryService {

    /**
     * PostgreSQL schema for CBS mirror tables.
     * Isolated from app tables (public) and Flowable (workflow).
     */
    private static final String MIRROR_SCHEMA = "cbs";

    private final DSLContext informixDsl;
    private final DSLContext primaryDsl;
    private final CbsDataDictionaryService dictionaryService;

    public DynamicCbsQueryService(
            @Qualifier("informixDsl") DSLContext informixDsl,
            @Qualifier("primaryDsl") DSLContext primaryDsl,
            CbsDataDictionaryService dictionaryService) {
        this.informixDsl = informixDsl;
        this.primaryDsl = primaryDsl;
        this.dictionaryService = dictionaryService;
    }

    /**
     * Returns schema-qualified table reference for jOOQ API calls (ALTER TABLE, etc.).
     * Uses DSL.name(schema, table) so jOOQ quotes them separately: "cbs"."bkcli"
     */
    private org.jooq.Name mirrorTableName(String tableName) {
        return DSL.name(MIRROR_SCHEMA, tableName);
    }

    /**
     * Returns schema.table string for raw SQL statements.
     */
    private String mirrorTableRaw(String tableName) {
        return MIRROR_SCHEMA + "." + tableName;
    }

    // ===== Schema Management =====

    /**
     * Ensures the PostgreSQL mirror table exists and has all columns from the dictionary.
     * Creates the table if missing, adds columns if they don't exist.
     */
    public void ensureMirrorSchema(String tableName) {
        // Ensure the cbs schema exists
        primaryDsl.execute("CREATE SCHEMA IF NOT EXISTS " + MIRROR_SCHEMA);

        CbsTableDto table = dictionaryService.getTableByName(tableName);
        List<CbsFieldDto> fields = dictionaryService.getFieldsByTableName(tableName);

        if (fields.isEmpty()) {
            log.warn("No fields defined for table {} in dictionary, skipping schema sync", tableName);
            return;
        }

        // Check if table exists in PostgreSQL public schema
        boolean tableExists = primaryDsl.meta().getTables().stream()
                .anyMatch(t -> t.getName().equalsIgnoreCase(tableName)
                        && (t.getSchema() == null || t.getSchema().getName().equalsIgnoreCase(MIRROR_SCHEMA)));

        if (!tableExists) {
            createMirrorTable(tableName, table, fields);
        } else {
            syncMirrorColumns(tableName, fields);
        }
    }

    private void createMirrorTable(String tableName, CbsTableDto table, List<CbsFieldDto> fields) {
        log.info("Creating mirror table: {}", tableName);

        // Build CREATE TABLE SQL dynamically
        StringBuilder sql = new StringBuilder("CREATE TABLE IF NOT EXISTS ").append(mirrorTableRaw(tableName)).append(" (");

        List<String> columnDefs = new ArrayList<>();
        for (CbsFieldDto field : fields) {
            columnDefs.add("\"" + field.getColumnName() + "\" " + toPostgresTypeDdl(field));
        }
        columnDefs.add("\"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        columnDefs.add("\"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        // Add primary key constraint
        if (table.getPrimaryKeyColumns() != null && !table.getPrimaryKeyColumns().isBlank()) {
            String pkCols = Arrays.stream(table.getPrimaryKeyColumns().split(","))
                    .map(c -> "\"" + c.trim() + "\"")
                    .collect(Collectors.joining(", "));
            columnDefs.add("PRIMARY KEY (" + pkCols + ")");
        }

        sql.append(String.join(", ", columnDefs));
        sql.append(")");

        primaryDsl.execute(sql.toString());
        log.info("Created mirror table {} with {} columns", tableName, fields.size());
    }

    private String toPostgresTypeDdl(CbsFieldDto field) {
        CbsDataType dt = field.getDataType();
        if (dt == null) return "VARCHAR(255)";
        return switch (dt) {
            case CHAR, VARCHAR -> "VARCHAR(" + (field.getMaxLength() != null ? field.getMaxLength() : 255) + ")";
            case INTEGER -> "INT";
            case SMALLINT -> "SMALLINT";
            case DECIMAL -> "DECIMAL(" + (field.getPrecisionValue() != null ? field.getPrecisionValue() : 15)
                    + "," + (field.getScaleValue() != null ? field.getScaleValue() : 0) + ")";
            case DATE -> "DATE";
            case DATETIME -> "TIMESTAMP";
            case BOOLEAN -> "BOOLEAN";
        };
    }

    private void syncMirrorColumns(String tableName, List<CbsFieldDto> fields) {
        Set<String> existingColumns = primaryDsl.meta()
                .getTables().stream()
                .filter(t -> t.getName().equalsIgnoreCase(tableName)
                        && (t.getSchema() == null || t.getSchema().getName().equalsIgnoreCase(MIRROR_SCHEMA)))
                .flatMap(t -> Arrays.stream(t.fields()))
                .map(f -> f.getName().toLowerCase())
                .collect(Collectors.toSet());

        int added = 0;
        for (CbsFieldDto field : fields) {
            if (!existingColumns.contains(field.getColumnName().toLowerCase())) {
                log.info("Adding column {}.{} ({})", tableName, field.getColumnName(), field.getDataType());
                primaryDsl.alterTable(mirrorTableName(tableName))
                        .addColumn(field.getColumnName(), mapToJooqType(field))
                        .execute();
                added++;
            }
        }

        if (added > 0) {
            log.info("Added {} new columns to mirror table {}", added, tableName);
        }
    }

    /**
     * When dictionary fields change, immediately sync the mirror table schema.
     * Handles column renames (ALTER TABLE RENAME COLUMN) and new columns (ADD COLUMN).
     */
    @EventListener
    public void onDictionaryChanged(DataDictionaryChangedEvent event) {
        String tableName = event.getTableName();
        if (tableName == null) return;

        try {
            // Handle column rename
            if (event.isColumnRename()) {
                log.info("Renaming mirror column {}.{} -> {}", tableName, event.getOldColumnName(), event.getNewColumnName());
                renameColumn(tableName, event.getOldColumnName(), event.getNewColumnName());
            }

            // Sync full schema (adds any missing columns)
            ensureMirrorSchema(tableName);
            log.info("Mirror schema synced for table '{}'", tableName);
        } catch (Exception e) {
            log.error("Failed to sync mirror schema for table '{}': {}", tableName, e.getMessage());
        }
    }

    /**
     * Rename a column in the mirror table.
     */
    private void renameColumn(String tableName, String oldName, String newName) {
        try {
            String sql = "ALTER TABLE " + mirrorTableRaw(tableName) + " RENAME COLUMN " + oldName + " TO " + newName;
            primaryDsl.execute(sql);
            log.info("Renamed column {}.{} -> {}", tableName, oldName, newName);
        } catch (Exception e) {
            log.warn("Could not rename column {}.{} -> {}: {} (will try ADD instead)", tableName, oldName, newName, e.getMessage());
        }
    }

    // ===== CBS Read Operations =====

    /**
     * Build jOOQ Field list from dictionary metadata for a table.
     */
    public List<Field<?>> buildSelectFields(String tableName) {
        List<CbsFieldDto> fields = dictionaryService.getFieldsByTableName(tableName);
        return fields.stream()
                .map(f -> DSL.field(DSL.unquotedName(f.getColumnName()), mapToJavaType(f.getDataType().name())))
                .collect(Collectors.toList());
    }

    /**
     * Fetch a batch of records from CBS (Informix) using dictionary-driven columns.
     */
    public List<Map<String, Object>> fetchFromCbs(String tableName, int offset, int limit) {
        List<Field<?>> selectFields = buildSelectFields(tableName);
        if (selectFields.isEmpty()) {
            log.warn("No fields defined for table {}", tableName);
            return Collections.emptyList();
        }

        // Informix uses SKIP/FIRST for pagination
        String sql = buildInformixPaginatedSelect(tableName, selectFields, offset, limit);

        try {
            org.jooq.Result<org.jooq.Record> result = informixDsl.fetch(sql);
            return result.stream()
                    .map(this::recordToMap)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching from CBS {}: {}", tableName, e.getMessage());
            throw new RuntimeException("Failed to fetch from CBS table " + tableName, e);
        }
    }

    /**
     * Fetch a single record by primary key from CBS.
     */
    public Map<String, Object> fetchByPk(String tableName, Map<String, Object> pkValues) {
        List<Field<?>> selectFields = buildSelectFields(tableName);
        if (selectFields.isEmpty()) {
            return Collections.emptyMap();
        }

        Condition where = buildPkCondition(pkValues);

        try {
            org.jooq.Record record = informixDsl.select(selectFields)
                    .from(DSL.table(DSL.unquotedName(tableName)))
                    .where(where)
                    .fetchOne();

            return record != null ? recordToMap(record) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Error fetching PK {} from CBS {}: {}", pkValues, tableName, e.getMessage());
            throw new RuntimeException("Record not found in CBS", e);
        }
    }

    /**
     * Fetch specific fields for a record from CBS. Used by reconciliation.
     */
    public Map<String, Object> fetchFieldsFromCbs(String tableName, String pkColumn, String pkValue, Set<String> fieldNames) {
        Set<String> allowedColumns = dictionaryService.getUpdatableColumns(tableName);
        List<Field<?>> fields = fieldNames.stream()
                .filter(allowedColumns::contains)
                .map(name -> DSL.field(DSL.unquotedName(name)))
                .collect(Collectors.toList());

        if (fields.isEmpty()) return Collections.emptyMap();

        // Add PK column
        fields.add(0, DSL.field(DSL.unquotedName(pkColumn)));

        try {
            org.jooq.Record record = informixDsl.select(fields)
                    .from(DSL.table(DSL.unquotedName(tableName)))
                    .where(DSL.field(DSL.unquotedName(pkColumn)).eq(pkValue))
                    .fetchOne();

            return record != null ? recordToMap(record) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Error fetching fields from CBS {}: {}", tableName, e.getMessage());
            throw new RuntimeException("Failed to fetch fields from CBS", e);
        }
    }

    /**
     * Count total records in a CBS table.
     */
    public long countCbsRecords(String tableName) {
        return informixDsl.fetchCount(DSL.table(DSL.unquotedName(tableName)));
    }

    // ===== PostgreSQL Mirror Write Operations =====

    /**
     * Upsert records into the PostgreSQL mirror table.
     * Uses INSERT ... ON CONFLICT DO UPDATE for efficiency.
     */
    public int upsertToMirror(String tableName, List<Map<String, Object>> records) {
        if (records.isEmpty()) return 0;

        CbsTableDto table = dictionaryService.getTableByName(tableName);
        List<CbsFieldDto> fields = dictionaryService.getFieldsByTableName(tableName);
        Set<String> pkColumns = Arrays.stream(table.getPrimaryKeyColumns().split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        List<Field<?>> allFields = fields.stream()
                .map(f -> DSL.field(DSL.unquotedName(f.getColumnName())))
                .collect(Collectors.toList());
        // Add updated_at
        allFields.add(DSL.field(DSL.unquotedName("updated_at")));

        List<Field<?>> nonPkFields = fields.stream()
                .filter(f -> !pkColumns.contains(f.getColumnName()))
                .map(f -> DSL.field(DSL.unquotedName(f.getColumnName())))
                .collect(Collectors.toList());
        nonPkFields.add(DSL.field(DSL.unquotedName("updated_at")));

        // Build PK column list for ON CONFLICT clause
        String pkColList = pkColumns.stream().collect(Collectors.joining(", "));

        int total = 0;
        for (Map<String, Object> record : records) {
            try {
                // Build values array
                List<Object> valuesList = new ArrayList<>();
                for (CbsFieldDto f : fields) {
                    valuesList.add(normalizeValue(record.get(f.getColumnName()), f));
                }
                valuesList.add(LocalDateTime.now()); // updated_at

                // Build INSERT ... ON CONFLICT DO UPDATE using raw SQL for reliability
                StringBuilder sql = new StringBuilder();
                sql.append("INSERT INTO ").append(mirrorTableRaw(tableName)).append(" (");
                sql.append(allFields.stream().map(Field::getName).collect(Collectors.joining(", ")));
                sql.append(") VALUES (");
                sql.append(allFields.stream().map(f -> "?").collect(Collectors.joining(", ")));
                sql.append(") ON CONFLICT (").append(pkColList).append(") DO UPDATE SET ");
                sql.append(nonPkFields.stream()
                        .map(f -> f.getName() + " = EXCLUDED." + f.getName())
                        .collect(Collectors.joining(", ")));

                primaryDsl.execute(sql.toString(), valuesList.toArray());

                total++;
            } catch (Exception e) {
                log.warn("Failed to upsert record into {}: {}", tableName, e.getMessage());
            }
        }

        return total;
    }

    // ===== CBS Write Operations =====

    /**
     * Update fields in the CBS (Informix) table.
     */
    public boolean updateCbsRecord(String tableName, String pkColumn, String pkValue, Map<String, Object> updates) {
        Set<String> allowedColumns = dictionaryService.getUpdatableColumns(tableName);

        // Validate all columns
        for (String col : updates.keySet()) {
            if (!allowedColumns.contains(col)) {
                throw new IllegalArgumentException("Column not allowed for update: " + col);
            }
        }

        // Build UPDATE SET ... WHERE using parameterized SQL
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE ").append(tableName).append(" SET ");

        boolean first = true;
        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            if (!first) sql.append(", ");
            sql.append(entry.getKey()).append(" = ?");
            params.add(entry.getValue());
            first = false;
        }
        sql.append(" WHERE ").append(pkColumn).append(" = ?");
        params.add(pkValue);

        int rows = informixDsl.execute(sql.toString(), params.toArray());
        log.info("Updated {} rows in CBS {}.{} = {}", rows, tableName, pkColumn, pkValue);
        return rows > 0;
    }

    // ===== Helpers =====

    private String buildInformixPaginatedSelect(String tableName, List<Field<?>> fields, int offset, int limit) {
        String columns = fields.stream()
                .map(f -> f.getName())
                .collect(Collectors.joining(", "));

        // Informix pagination uses SKIP/FIRST syntax
        return String.format("SELECT SKIP %d FIRST %d %s FROM %s ORDER BY %s ",
                offset, limit, columns, tableName,
                fields.get(0).getName()); // Order by first column (usually PK)
    }

    private Condition buildPkCondition(Map<String, Object> pkValues) {
        Condition condition = DSL.trueCondition();
        for (Map.Entry<String, Object> entry : pkValues.entrySet()) {
            condition = condition.and(DSL.field(DSL.unquotedName(entry.getKey())).eq(entry.getValue()));
        }
        return condition;
    }

    private Map<String, Object> recordToMap(org.jooq.Record record) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (Field<?> field : record.fields()) {
            Object value = record.get(field);
            // Trim string values (CBS often has padded CHAR fields)
            if (value instanceof String s) {
                value = s.trim();
            }
            map.put(field.getName().toLowerCase(), value);
        }
        return map;
    }

    private Object normalizeValue(Object value, CbsFieldDto field) {
        if (value == null) return null;

        if (value instanceof String s) {
            String trimmed = s.trim();
            if (trimmed.isEmpty()) return null;

            // Truncate to max length
            if (field.getMaxLength() != null && trimmed.length() > field.getMaxLength()) {
                return trimmed.substring(0, field.getMaxLength());
            }
            return trimmed;
        }

        return value;
    }

    /**
     * Map CbsDataType to jOOQ DataType for DDL (CREATE/ALTER TABLE).
     */
    private DataType<?> mapToJooqType(CbsFieldDto field) {
        CbsDataType dt = field.getDataType();
        if (dt == null) return SQLDataType.VARCHAR(255);

        return switch (dt) {
            case CHAR, VARCHAR -> {
                int len = field.getMaxLength() != null ? field.getMaxLength() : 255;
                yield SQLDataType.VARCHAR(len);
            }
            case INTEGER -> SQLDataType.INTEGER;
            case SMALLINT -> SQLDataType.SMALLINT;
            case DECIMAL -> {
                int p = field.getPrecisionValue() != null ? field.getPrecisionValue() : 15;
                int s = field.getScaleValue() != null ? field.getScaleValue() : 0;
                yield SQLDataType.DECIMAL(p, s);
            }
            case DATE -> SQLDataType.LOCALDATE;
            case DATETIME -> SQLDataType.LOCALDATETIME;
            case BOOLEAN -> SQLDataType.BOOLEAN;
        };
    }

    /**
     * Map CbsDataType to Java class for jOOQ Field typing.
     */
    private Class<?> mapToJavaType(String dataType) {
        if (dataType == null) return String.class;
        return switch (dataType) {
            case "CHAR", "VARCHAR" -> String.class;
            case "INTEGER" -> Integer.class;
            case "SMALLINT" -> Short.class;
            case "DECIMAL" -> BigDecimal.class;
            case "DATE" -> LocalDate.class;
            case "DATETIME" -> LocalDateTime.class;
            case "BOOLEAN" -> Boolean.class;
            default -> String.class;
        };
    }
}
