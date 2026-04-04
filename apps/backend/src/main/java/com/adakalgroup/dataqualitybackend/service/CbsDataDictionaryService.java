package com.adakalgroup.dataqualitybackend.service;

import com.adakalgroup.dataqualitybackend.dto.CbsFieldDto;
import com.adakalgroup.dataqualitybackend.dto.CbsTableDto;
import com.adakalgroup.dataqualitybackend.model.CbsField;
import com.adakalgroup.dataqualitybackend.model.CbsTable;
import com.adakalgroup.dataqualitybackend.repository.CbsFieldRepository;
import com.adakalgroup.dataqualitybackend.repository.CbsTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CbsDataDictionaryService {

    private final CbsTableRepository cbsTableRepository;
    private final CbsFieldRepository cbsFieldRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ===== CbsTable CRUD =====

    public List<CbsTableDto> getAllTables() {
        return cbsTableRepository.findAll()
                .stream()
                .map(this::mapTableToDto)
                .collect(Collectors.toList());
    }

    public List<CbsTableDto> getActiveTables() {
        return cbsTableRepository.findByActiveTrue()
                .stream()
                .map(this::mapTableToDto)
                .collect(Collectors.toList());
    }

    public CbsTableDto getTable(Long id) {
        CbsTable table = cbsTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS table not found with id: " + id));
        return mapTableToDto(table);
    }

    public CbsTableDto getTableByName(String tableName) {
        CbsTable table = cbsTableRepository.findByTableName(tableName)
                .orElseThrow(() -> new RuntimeException("CBS table not found: " + tableName));
        return mapTableToDto(table);
    }

    @Transactional
    public CbsTableDto createTable(CbsTableDto dto) {
        CbsTable table = CbsTable.builder()
                .tableName(dto.getTableName())
                .displayName(dto.getDisplayName())
                .description(dto.getDescription())
                .schemaName(dto.getSchemaName())
                .cbsVersion(dto.getCbsVersion())
                .primaryKeyColumns(dto.getPrimaryKeyColumns())
                .syncEnabled(dto.getSyncEnabled() != null ? dto.getSyncEnabled() : false)
                .syncOrder(dto.getSyncOrder())
                .validationEnabled(dto.getValidationEnabled() != null ? dto.getValidationEnabled() : false)
                .pkField(dto.getPkField())
                .labelField(dto.getLabelField())
                .labelFieldCorporate(dto.getLabelFieldCorporate())
                .structureField(dto.getStructureField())
                .typeField(dto.getTypeField())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        CbsTable saved = cbsTableRepository.save(table);
        log.info("Created CBS table: {}", saved.getTableName());
        publishChangedEvent(saved.getTableName());
        return mapTableToDto(saved);
    }

    @Transactional
    public CbsTableDto updateTable(Long id, CbsTableDto dto) {
        CbsTable table = cbsTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS table not found with id: " + id));

        table.setTableName(dto.getTableName());
        table.setDisplayName(dto.getDisplayName());
        table.setDescription(dto.getDescription());
        table.setSchemaName(dto.getSchemaName());
        table.setCbsVersion(dto.getCbsVersion());
        table.setPrimaryKeyColumns(dto.getPrimaryKeyColumns());
        if (dto.getSyncEnabled() != null) table.setSyncEnabled(dto.getSyncEnabled());
        table.setSyncOrder(dto.getSyncOrder());
        if (dto.getValidationEnabled() != null) table.setValidationEnabled(dto.getValidationEnabled());
        table.setPkField(dto.getPkField());
        table.setLabelField(dto.getLabelField());
        table.setLabelFieldCorporate(dto.getLabelFieldCorporate());
        table.setStructureField(dto.getStructureField());
        table.setTypeField(dto.getTypeField());
        if (dto.getActive() != null) table.setActive(dto.getActive());

        CbsTable updated = cbsTableRepository.save(table);
        log.info("Updated CBS table: {}", updated.getTableName());
        publishChangedEvent(updated.getTableName());
        return mapTableToDto(updated);
    }

    @Transactional
    public void deleteTable(Long id) {
        CbsTable table = cbsTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS table not found with id: " + id));
        table.setActive(false);
        cbsTableRepository.save(table);
        log.info("Soft-deleted CBS table: {}", table.getTableName());
        publishChangedEvent(table.getTableName());
    }

    // ===== CbsField CRUD =====

    public List<CbsFieldDto> getFieldsByTable(Long tableId) {
        return cbsFieldRepository.findByCbsTableIdAndActiveTrueOrderByDisplayOrderAsc(tableId)
                .stream()
                .map(this::mapFieldToDto)
                .collect(Collectors.toList());
    }

    public List<CbsFieldDto> getFieldsByTableName(String tableName) {
        return cbsFieldRepository.findByCbsTableTableNameAndActiveTrue(tableName)
                .stream()
                .map(this::mapFieldToDto)
                .collect(Collectors.toList());
    }

    public CbsFieldDto getField(Long id) {
        CbsField field = cbsFieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS field not found with id: " + id));
        return mapFieldToDto(field);
    }

    @Transactional
    public CbsFieldDto createField(Long tableId, CbsFieldDto dto) {
        CbsTable table = cbsTableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("CBS table not found with id: " + tableId));

        CbsField field = CbsField.builder()
                .cbsTable(table)
                .columnName(dto.getColumnName())
                .displayLabel(dto.getDisplayLabel())
                .description(dto.getDescription())
                .queryAlias(dto.getQueryAlias())
                .dataType(dto.getDataType())
                .maxLength(dto.getMaxLength())
                .precisionValue(dto.getPrecisionValue())
                .scaleValue(dto.getScaleValue())
                .isPrimaryKey(dto.getIsPrimaryKey() != null ? dto.getIsPrimaryKey() : false)
                .isRequired(dto.getIsRequired() != null ? dto.getIsRequired() : false)
                .isUpdatable(dto.getIsUpdatable() != null ? dto.getIsUpdatable() : true)
                .apiFieldPath(dto.getApiFieldPath())
                .nomenclatureCtab(dto.getNomenclatureCtab())
                .nomenclatureDescription(dto.getNomenclatureDescription())
                .enumValues(dto.getEnumValues())
                .applicableClientTypes(dto.getApplicableClientTypes())
                .displayOrder(dto.getDisplayOrder())
                .fieldGroup(dto.getFieldGroup())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        CbsField saved = cbsFieldRepository.save(field);
        log.info("Created CBS field: {}.{}", table.getTableName(), saved.getColumnName());
        publishChangedEvent(table.getTableName());
        return mapFieldToDto(saved);
    }

    @Transactional
    public CbsFieldDto updateField(Long id, CbsFieldDto dto) {
        CbsField field = cbsFieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS field not found with id: " + id));

        String oldColumnName = field.getColumnName();
        String newColumnName = dto.getColumnName();

        field.setColumnName(newColumnName);
        field.setDisplayLabel(dto.getDisplayLabel());
        field.setDescription(dto.getDescription());
        field.setQueryAlias(dto.getQueryAlias());
        field.setDataType(dto.getDataType());
        field.setMaxLength(dto.getMaxLength());
        field.setPrecisionValue(dto.getPrecisionValue());
        field.setScaleValue(dto.getScaleValue());
        if (dto.getIsPrimaryKey() != null) field.setIsPrimaryKey(dto.getIsPrimaryKey());
        if (dto.getIsRequired() != null) field.setIsRequired(dto.getIsRequired());
        if (dto.getIsUpdatable() != null) field.setIsUpdatable(dto.getIsUpdatable());
        field.setApiFieldPath(dto.getApiFieldPath());
        field.setNomenclatureCtab(dto.getNomenclatureCtab());
        field.setNomenclatureDescription(dto.getNomenclatureDescription());
        field.setEnumValues(dto.getEnumValues());
        field.setApplicableClientTypes(dto.getApplicableClientTypes());
        field.setDisplayOrder(dto.getDisplayOrder());
        field.setFieldGroup(dto.getFieldGroup());
        if (dto.getActive() != null) field.setActive(dto.getActive());

        CbsField updated = cbsFieldRepository.save(field);
        String parentTable = field.getCbsTable().getTableName();
        log.info("Updated CBS field: {}.{}", parentTable, updated.getColumnName());

        // Publish event with old/new column names so mirror can RENAME COLUMN
        eventPublisher.publishEvent(
                new DataDictionaryChangedEvent(this, parentTable, oldColumnName, newColumnName));
        return mapFieldToDto(updated);
    }

    @Transactional
    public void deleteField(Long id) {
        CbsField field = cbsFieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CBS field not found with id: " + id));
        field.setActive(false);
        cbsFieldRepository.save(field);
        String parentTable = field.getCbsTable().getTableName();
        log.info("Soft-deleted CBS field: {}.{}", parentTable, field.getColumnName());
        publishChangedEvent(parentTable);
    }

    // ===== Metadata queries (used by other services) =====

    public Set<String> getUpdatableColumns(String tableName) {
        return cbsFieldRepository.findByCbsTableTableNameAndIsUpdatableTrue(tableName)
                .stream()
                .map(CbsField::getColumnName)
                .collect(Collectors.toSet());
    }

    public Map<String, String> getColumnAliasMap(String tableName) {
        return cbsFieldRepository.findByCbsTableTableNameAndActiveTrue(tableName)
                .stream()
                .filter(f -> f.getQueryAlias() != null)
                .collect(Collectors.toMap(CbsField::getColumnName, CbsField::getQueryAlias));
    }

    public Map<String, String> getFieldLabels(String tableName) {
        return cbsFieldRepository.findByCbsTableTableNameAndActiveTrue(tableName)
                .stream()
                .filter(f -> f.getDisplayLabel() != null)
                .collect(Collectors.toMap(CbsField::getColumnName, CbsField::getDisplayLabel));
    }

    public boolean isAllowedColumn(String tableName, String columnName) {
        return cbsFieldRepository.findByCbsTableTableNameAndColumnName(tableName, columnName)
                .map(f -> f.getActive() && f.getIsUpdatable())
                .orElse(false);
    }

    public Optional<CbsField> getFieldMetadata(String tableName, String columnName) {
        return cbsFieldRepository.findByCbsTableTableNameAndColumnName(tableName, columnName);
    }

    public Map<String, String> getApiFieldMapping(String tableName) {
        return cbsFieldRepository.findByCbsTableTableNameAndActiveTrue(tableName)
                .stream()
                .filter(f -> f.getApiFieldPath() != null && !f.getApiFieldPath().isBlank())
                .collect(Collectors.toMap(CbsField::getColumnName, CbsField::getApiFieldPath));
    }

    public Optional<String> getNomenclatureCtab(String tableName, String columnName) {
        return cbsFieldRepository.findByCbsTableTableNameAndColumnName(tableName, columnName)
                .map(CbsField::getNomenclatureCtab);
    }

    // ===== Mappers =====

    private CbsTableDto mapTableToDto(CbsTable entity) {
        // Use a count query instead of accessing lazy-loaded fields collection
        int fieldCount = (int) cbsFieldRepository.countByCbsTableIdAndActiveTrue(entity.getId());

        return CbsTableDto.builder()
                .id(entity.getId())
                .tableName(entity.getTableName())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .schemaName(entity.getSchemaName())
                .cbsVersion(entity.getCbsVersion())
                .primaryKeyColumns(entity.getPrimaryKeyColumns())
                .syncEnabled(entity.getSyncEnabled())
                .syncOrder(entity.getSyncOrder())
                .validationEnabled(entity.getValidationEnabled())
                .pkField(entity.getPkField())
                .labelField(entity.getLabelField())
                .labelFieldCorporate(entity.getLabelFieldCorporate())
                .structureField(entity.getStructureField())
                .typeField(entity.getTypeField())
                .active(entity.getActive())
                .fieldCount(fieldCount)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private CbsFieldDto mapFieldToDto(CbsField entity) {
        return CbsFieldDto.builder()
                .id(entity.getId())
                .cbsTableId(entity.getCbsTable().getId())
                .tableName(entity.getCbsTable().getTableName())
                .columnName(entity.getColumnName())
                .displayLabel(entity.getDisplayLabel())
                .description(entity.getDescription())
                .queryAlias(entity.getQueryAlias())
                .dataType(entity.getDataType())
                .maxLength(entity.getMaxLength())
                .precisionValue(entity.getPrecisionValue())
                .scaleValue(entity.getScaleValue())
                .isPrimaryKey(entity.getIsPrimaryKey())
                .isRequired(entity.getIsRequired())
                .isUpdatable(entity.getIsUpdatable())
                .apiFieldPath(entity.getApiFieldPath())
                .nomenclatureCtab(entity.getNomenclatureCtab())
                .nomenclatureDescription(entity.getNomenclatureDescription())
                .enumValues(entity.getEnumValues())
                .applicableClientTypes(entity.getApplicableClientTypes())
                .displayOrder(entity.getDisplayOrder())
                .fieldGroup(entity.getFieldGroup())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private void publishChangedEvent(String tableName) {
        eventPublisher.publishEvent(new DataDictionaryChangedEvent(this, tableName));
    }
}
