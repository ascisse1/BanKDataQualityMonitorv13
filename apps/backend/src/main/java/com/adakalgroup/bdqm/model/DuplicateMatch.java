package com.adakalgroup.bdqm.model;

import com.adakalgroup.bdqm.model.enums.DuplicateMatchStatus;
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
@Table(schema = "public", name = "duplicate_matches", indexes = {
    @Index(name = "idx_dup_match_status", columnList = "status"),
    @Index(name = "idx_dup_match_client_type", columnList = "client_type"),
    @Index(name = "idx_dup_match_score", columnList = "similarity_score"),
    @Index(name = "idx_dup_match_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id_1", nullable = false, length = 15)
    private String clientId1;

    @Column(name = "client_id_2", nullable = false, length = 15)
    private String clientId2;

    @Column(name = "client_name_1", nullable = false)
    private String clientName1;

    @Column(name = "client_name_2", nullable = false)
    private String clientName2;

    @Column(name = "similarity_score", nullable = false)
    private double similarityScore;

    @Column(name = "matching_fields", columnDefinition = "TEXT")
    private String matchingFields;

    @Column(name = "client_type", nullable = false, length = 20)
    private String clientType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DuplicateMatchStatus status = DuplicateMatchStatus.PENDING;

    @Column(name = "structure_code", length = 10)
    private String structureCode;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
