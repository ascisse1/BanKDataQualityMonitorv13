package com.bsic.dataqualitybackend.model.enums;

import java.util.Arrays;

public enum ClientType {
    INDIVIDUAL("1"),
    CORPORATE("2"),
    INSTITUTIONAL("3");

    private final String code;

    ClientType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
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
