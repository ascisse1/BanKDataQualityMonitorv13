package com.bsic.dataqualitybackend.model.converter;

import com.bsic.dataqualitybackend.model.enums.RuleType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter()
public class RuleTypeConverter implements AttributeConverter<RuleType, String> {

    @Override
    public String convertToDatabaseColumn(RuleType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public RuleType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : RuleType.valueOf(dbData.toUpperCase());
    }
}
