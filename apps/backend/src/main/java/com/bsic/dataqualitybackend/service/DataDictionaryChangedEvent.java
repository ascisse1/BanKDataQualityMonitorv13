package com.bsic.dataqualitybackend.service;

import org.springframework.context.ApplicationEvent;

/**
 * Event published when CBS data dictionary metadata changes.
 * Carries the affected table name so listeners can react precisely.
 */
public class DataDictionaryChangedEvent extends ApplicationEvent {

    private final String tableName;
    private final String oldColumnName;
    private final String newColumnName;

    public DataDictionaryChangedEvent(Object source, String tableName) {
        this(source, tableName, null, null);
    }

    public DataDictionaryChangedEvent(Object source, String tableName, String oldColumnName, String newColumnName) {
        super(source);
        this.tableName = tableName;
        this.oldColumnName = oldColumnName;
        this.newColumnName = newColumnName;
    }

    public String getTableName() {
        return tableName;
    }

    public String getOldColumnName() {
        return oldColumnName;
    }

    public String getNewColumnName() {
        return newColumnName;
    }

    public boolean isColumnRename() {
        return oldColumnName != null && newColumnName != null && !oldColumnName.equals(newColumnName);
    }
}
