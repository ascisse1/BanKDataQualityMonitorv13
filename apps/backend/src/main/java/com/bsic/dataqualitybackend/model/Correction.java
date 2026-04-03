package com.bsic.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(schema = "public",name = "corrections", indexes = {
    @Index(name = "idx_corrections_ticket_id", columnList = "ticket_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_corrections_ticket_field", columnNames = {"ticket_id", "field_name"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Correction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, length = 30)
    private String ticketId;

    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @Column(name = "field_label", length = 100)
    private String fieldLabel;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "cbs_value", columnDefinition = "TEXT")
    private String cbsValue;

    @Column(name = "is_matched", nullable = false)
    @Builder.Default
    private Boolean isMatched = false;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    public void markMatched(String cbsValue) {
        this.cbsValue = cbsValue;
        this.isMatched = true;
        this.lastCheckedAt = LocalDateTime.now();
    }

    public void markUnmatched(String cbsValue) {
        this.cbsValue = cbsValue;
        this.isMatched = false;
        this.lastCheckedAt = LocalDateTime.now();
    }
}
