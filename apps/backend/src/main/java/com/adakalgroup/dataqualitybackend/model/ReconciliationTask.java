package com.adakalgroup.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(schema = "public",name = "reconciliation_tasks", indexes = {
    @Index(name = "idx_recon_tasks_ticket_id", columnList = "ticket_id"),
    @Index(name = "idx_recon_tasks_client_id", columnList = "client_id"),
    @Index(name = "idx_recon_tasks_status", columnList = "status"),
    @Index(name = "idx_recon_tasks_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, length = 30)
    private String ticketId;

    @Column(name = "client_id", nullable = false, length = 15)
    private String clientId;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "pending";

    @Column(name = "attempts", nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "abandoned_at")
    private LocalDateTime abandonedAt;

    @Column(name = "abandoned_reason", columnDefinition = "TEXT")
    private String abandonedReason;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReconciliationAttempt> attemptHistory = new ArrayList<>();

    // Transient fields populated from ticket join
    @Transient
    private String clientName;

    @Transient
    private String structureCode;

    public void incrementAttempts() {
        this.attempts = (this.attempts == null ? 0 : this.attempts) + 1;
        this.lastAttemptAt = LocalDateTime.now();
    }

    public void markReconciled() {
        this.status = "reconciled";
        this.reconciledAt = LocalDateTime.now();
        this.errorMessage = null;
        incrementAttempts();
    }

    public void markFailed(String error) {
        this.status = "failed";
        this.errorMessage = error;
        incrementAttempts();
    }

    public void markPartial() {
        this.status = "partial";
        this.errorMessage = null;
        incrementAttempts();
    }

    public void markAbandoned(String reason) {
        this.status = "abandoned";
        this.abandonedAt = LocalDateTime.now();
        this.abandonedReason = reason;
    }

    public boolean isTerminal() {
        return "reconciled".equals(status) || "abandoned".equals(status);
    }
}
