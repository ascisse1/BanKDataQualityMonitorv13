package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.LoadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataLoadHistoryDto {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Integer recordsTotal;
    private Integer recordsProcessed;
    private Integer recordsSuccess;
    private Integer recordsFailed;
    private Integer anomaliesDetected;
    private LoadStatus status;
    private String errorMessage;
    private String uploadedBy;
    private Long processingTimeMs;
    private LocalDateTime loadDate;
}
