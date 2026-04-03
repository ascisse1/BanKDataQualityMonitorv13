package com.bsic.dataqualitybackend.model.enums;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum ClientType {
    INDIVIDUAL("1"),
    CORPORATE("2"),
    INSTITUTIONAL("3");

    private final String code;

    ClientType(String code) {
        this.code = code;
    }

    public static ClientType fromCode(String code) {
        if (code == null) {
            return null;
        }
        return Arrays.stream(values())
                .filter(ct -> ct.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown ClientType code: " + code));
    }
}
