package com.adakalgroup.bdqm.model;

import com.adakalgroup.bdqm.model.enums.ClientType;
import com.adakalgroup.bdqm.model.enums.FatcaStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Filter(name = "structureFilter", condition = "structure_code IN (:codes)")
@Table(schema = "public",name = "fatca_clients", indexes = {
    @Index(name = "idx_fatca_client_type", columnList = "client_type"),
    @Index(name = "idx_fatca_status", columnList = "fatca_status"),
    @Index(name = "idx_fatca_agency", columnList = "structure_code"),
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

    @Column(name = "structure_code", nullable = false)
    private String structureCode;

    @Column(name = "structure_name")
    private String structureName;

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

    @Column(name = "nationality")
    private String nationality;

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

    @Column(name = "w9_received_date")
    private LocalDate w9ReceivedDate;

    @Column(name = "w8_received_date")
    private LocalDate w8ReceivedDate;

    @Column(name = "w9_expiry_date")
    private LocalDate w9ExpiryDate;

    @Column(name = "w8_expiry_date")
    private LocalDate w8ExpiryDate;

    @Column(name = "document_status", length = 30)
    private String documentStatus;

    @Column(name = "document_notes", columnDefinition = "TEXT")
    private String documentNotes;

    @Column(name = "indicia_types", length = 255)
    private String indiciaTypes;

    @Column(name = "indicia_count")
    @Builder.Default
    private Integer indiciaCount = 0;

    @Column(name = "last_screening_date")
    private LocalDateTime lastScreeningDate;

    @Column(name = "detection_source", length = 30)
    @Builder.Default
    private String detectionSource = "MANUAL";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
