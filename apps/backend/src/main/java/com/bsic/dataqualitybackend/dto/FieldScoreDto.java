package com.bsic.dataqualitybackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldScoreDto {
    private String field;
    private double score;

    @JsonProperty("value_1")
    private String value1;

    @JsonProperty("value_2")
    private String value2;
}
