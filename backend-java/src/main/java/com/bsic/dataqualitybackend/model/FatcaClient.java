package com.bsic.dataqualitybackend.model;

import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.FatcaStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fatca_clients", indexes = {
    @Index(name = "idx_fatca_client_type", columnList = "client_type"),
    @Index(name = "idx_fatca_status", columnList = "fatca_status"),
    @Index(name = "idx_fatca_agency", columnList = "agency_code"),
    @Index(name = "idx_fatca_risk_level", columnList = "risk_level")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FatcaClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_number", nullable = false, unique = true)
    private String clientNumber;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", nullable = false)
    private ClientType clientType;

    @Column(name = "agency_code", nullable = false)
    private String agencyCode;

    @Column(name = "agency_name")
    private String agencyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "fatca_status", nullable = false)
    private FatcaStatus fatcaStatus;

    @Column(name = "tax_residence_country")
    private String taxResidenceCountry;

    @Column(name = "us_person")
    @Builder.Default
    private Boolean usPerson = false;

    @Column(name = "us_tin")
    private String usTin;

    @Column(name = "w9_form_received")
    @Builder.Default
    private Boolean w9FormReceived = false;

    @Column(name = "w8_form_received")
    @Builder.Default
    private Boolean w8FormReceived = false;

    @Column(name = "birth_place")
    private String birthPlace;

    @Column(name = "birth_country")
    private String birthCountry;

    @Column(name = "us_address")
    @Builder.Default
    private Boolean usAddress = false;

    @Column(name = "us_phone")
    @Builder.Default
    private Boolean usPhone = false;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "last_review_date")
    private LocalDate lastReviewDate;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "declaration_date")
    private LocalDate declarationDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reporting_required")
    @Builder.Default
    private Boolean reportingRequired = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
