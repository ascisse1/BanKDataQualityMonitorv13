package com.bsic.dataqualitybackend.dto;

import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.FatcaStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FatcaClientDto {
    private Long id;
    private String clientNumber;
    private String clientName;
    private ClientType clientType;
    private String agencyCode;
    private String agencyName;
    private FatcaStatus fatcaStatus;
    private String taxResidenceCountry;
    private Boolean usPerson;
    private String usTin;
    private Boolean w9FormReceived;
    private Boolean w8FormReceived;
    private String birthPlace;
    private String birthCountry;
    private Boolean usAddress;
    private Boolean usPhone;
    private String riskLevel;
    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;
    private LocalDate declarationDate;
    private String notes;
    private Boolean reportingRequired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
