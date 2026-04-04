package com.adakalgroup.dataqualitybackend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRequest {

    /** Free-text question from the user */
    private String question;

    /** Optional context: anomaly ID, client number, field name, etc. */
    private Long anomalyId;
    private String clientNumber;
    private String fieldName;
    private String currentValue;
    private String errorMessage;
    private String structureCode;
}
