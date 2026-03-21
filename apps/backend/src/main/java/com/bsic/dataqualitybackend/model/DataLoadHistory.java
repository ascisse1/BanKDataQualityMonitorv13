package com.bsic.dataqualitybackend.model;

import com.bsic.dataqualitybackend.model.enums.LoadStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_load_history", indexes = {
    @Index(name = "idx_load_status", columnList = "status"),
    @Index(name = "idx_load_date", columnList = "load_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataLoadHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "records_total")
    private Integer recordsTotal;

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column(name = "records_success")
    private Integer recordsSuccess;

    @Column(name = "records_failed")
    private Integer recordsFailed;

    @Column(name = "anomalies_detected")
    private Integer anomaliesDetected;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LoadStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @CreationTimestamp
    @Column(name = "load_date", nullable = false, updatable = false)
    private LocalDateTime loadDate;
}
