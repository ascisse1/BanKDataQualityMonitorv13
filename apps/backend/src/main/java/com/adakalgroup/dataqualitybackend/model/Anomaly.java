package com.adakalgroup.dataqualitybackend.model;

import com.adakalgroup.dataqualitybackend.model.enums.AnomalyStatus;
import com.adakalgroup.dataqualitybackend.model.enums.ClientType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Filter(name = "structureFilter", condition = "structure_code IN (:codes)")
@Table(schema = "public",name = "anomalies", indexes = {
    @Index(name = "idx_anomaly_client_type", columnList = "client_type"),
    @Index(name = "idx_anomaly_status", columnList = "status"),
    @Index(name = "idx_anomaly_agency", columnList = "structure_code"),
    @Index(name = "idx_anomaly_created", columnList = "created_at"),
    @Index(name = "idx_anomaly_ticket_id", columnList = "ticket_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Anomaly {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_number", nullable = false)
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

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "field_label")
    private String fieldLabel;

    @Column(name = "current_value", columnDefinition = "TEXT")
    private String currentValue;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(name = "error_type")
    private String errorType;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AnomalyStatus status = AnomalyStatus.PENDING;

    @Column(name = "correction_value", columnDefinition = "TEXT")
    private String correctionValue;

    @Column(name = "corrected_by")
    private String correctedBy;

    @Column(name = "corrected_at")
    private LocalDateTime correctedAt;

    @Column(name = "validation_comment", columnDefinition = "TEXT")
    private String validationComment;

    @Column(name = "validated_by")
    private String validatedBy;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "severity")
    private String severity;

    @Column(name = "data_source")
    private String dataSource;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
