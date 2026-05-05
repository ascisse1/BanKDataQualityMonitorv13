package com.adakalgroup.bdqm.ai.model.converter;

import com.adakalgroup.bdqm.ai.model.SuggestionAlternative;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

/**
 * JPA converter for List<SuggestionAlternative> to JSON string.
 */
@Slf4j
@Converter
public class SuggestionAlternativeListConverter implements AttributeConverter<List<SuggestionAlternative>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<SuggestionAlternative> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error converting SuggestionAlternative list to JSON", e);
            return null;
        }
    }

    @Override
    public List<SuggestionAlternative> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(dbData, new TypeReference<List<SuggestionAlternative>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to SuggestionAlternative list", e);
            return Collections.emptyList();
        }
    }
}
