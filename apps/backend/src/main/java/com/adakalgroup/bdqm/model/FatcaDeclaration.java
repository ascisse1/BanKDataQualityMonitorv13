package com.adakalgroup.bdqm.model;

import com.adakalgroup.bdqm.model.enums.DeclarationStatus;
import com.adakalgroup.bdqm.model.enums.DeclarationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(schema = "public", name = "fatca_declarations", indexes = {
    @Index(name = "idx_fatca_decl_year", columnList = "reporting_year"),
    @Index(name = "idx_fatca_decl_status", columnList = "status"),
    @Index(name = "idx_fatca_decl_msg_ref", columnList = "message_ref_id")
})
public class FatcaDeclaration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporting_year", nullable = false)
    private Integer reportingYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "declaration_type", nullable = false, length = 20)
    private DeclarationType declarationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DeclarationStatus status = DeclarationStatus.DRAFT;

    @Column(name = "xml_content", columnDefinition = "TEXT")
    private String xmlContent;

    @Column(name = "xml_hash", length = 64)
    private String xmlHash;

    @Column(name = "generated_by", nullable = false, length = 100)
    private String generatedBy;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "validated_by", length = 100)
    private String validatedBy;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "validation_notes", columnDefinition = "TEXT")
    private String validationNotes;

    @Column(name = "signed_by", length = 100)
    private String signedBy;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "ack_received_at")
    private LocalDateTime ackReceivedAt;

    @Column(name = "message_ref_id", nullable = false, unique = true, length = 200)
    private String messageRefId;

    @Column(name = "corrected_message_ref_id", length = 200)
    private String correctedMessageRefId;

    @Column(name = "total_accounts", nullable = false)
    @Builder.Default
    private Integer totalAccounts = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
