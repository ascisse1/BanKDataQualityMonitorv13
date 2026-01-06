package com.bsic.dataqualitybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResultDto {
    private String fileName;
    private Integer totalRows;
    private Integer processedRows;
    private Integer successRows;
    private Integer failedRows;
    private Integer anomaliesDetected;
    private Long processingTimeMs;
    private List<String> errors;
    private String status;
}
