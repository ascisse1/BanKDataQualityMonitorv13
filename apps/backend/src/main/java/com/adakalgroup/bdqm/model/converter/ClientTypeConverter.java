package com.adakalgroup.bdqm.model.converter;

import com.adakalgroup.bdqm.model.enums.ClientType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ClientTypeConverter implements AttributeConverter<ClientType, String> {

    @Override
    public String convertToDatabaseColumn(ClientType clientType) {
        if (clientType == null) {
            return null;
        }
        return clientType.getCode();
    }

    @Override
    public ClientType convertToEntityAttribute(String code) {
        if (code == null || code.isEmpty()) {
            return null;
        }
        return ClientType.fromCode(code);
    }
}
