package com.adakalgroup.bdqm.ai.model.converter;

import com.adakalgroup.bdqm.ai.model.RiskFactor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

/**
 * JPA converter for List<RiskFactor> to JSON string.
 */
@Slf4j
@Converter
public class RiskFactorListConverter implements AttributeConverter<List<RiskFactor>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<RiskFactor> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error converting RiskFactor list to JSON", e);
            return null;
        }
    }

    @Override
    public List<RiskFactor> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(dbData, new TypeReference<List<RiskFactor>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to RiskFactor list", e);
            return Collections.emptyList();
        }
    }
}
