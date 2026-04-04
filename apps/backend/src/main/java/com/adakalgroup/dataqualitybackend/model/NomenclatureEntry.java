package com.adakalgroup.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(schema = "public",name = "nomenclature_entries", uniqueConstraints = {
    @UniqueConstraint(name = "uk_nom_entry_ctab_cacc_age", columnNames = {"ctab", "cacc", "age"})
}, indexes = {
    @Index(name = "idx_nom_entry_type", columnList = "nomenclature_type_id"),
    @Index(name = "idx_nom_entry_ctab_cacc", columnList = "ctab, cacc")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NomenclatureEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nomenclature_type_id", nullable = false)
    private NomenclatureType nomenclatureType;

    @Column(name = "ctab", nullable = false, length = 3)
    private String ctab;

    @Column(name = "cacc", nullable = false, length = 10)
    private String cacc;

    @Column(name = "age", length = 5)
    private String age;

    @Column(name = "lib1", length = 30)
    private String lib1;

    @Column(name = "lib2", length = 30)
    private String lib2;

    @Column(name = "lib3", length = 30)
    private String lib3;

    @Column(name = "lib4", length = 30)
    private String lib4;

    @Column(name = "lib5", length = 30)
    private String lib5;

    @Column(name = "mnt1", precision = 15, scale = 0)
    private BigDecimal mnt1;

    @Column(name = "mnt2", precision = 15, scale = 0)
    private BigDecimal mnt2;

    @Column(name = "mnt3", precision = 15, scale = 0)
    private BigDecimal mnt3;

    @Column(name = "mnt4", precision = 15, scale = 0)
    private BigDecimal mnt4;

    @Column(name = "mnt5", precision = 15, scale = 0)
    private BigDecimal mnt5;

    @Column(name = "mnt6", precision = 15, scale = 0)
    private BigDecimal mnt6;

    @Column(name = "mnt7", precision = 15, scale = 0)
    private BigDecimal mnt7;

    @Column(name = "mnt8", precision = 15, scale = 0)
    private BigDecimal mnt8;

    @Column(name = "tau1", precision = 15, scale = 7)
    private BigDecimal tau1;

    @Column(name = "tau2", precision = 15, scale = 7)
    private BigDecimal tau2;

    @Column(name = "tau3", precision = 15, scale = 7)
    private BigDecimal tau3;

    @Column(name = "tau4", precision = 15, scale = 7)
    private BigDecimal tau4;

    @Column(name = "tau5", precision = 15, scale = 7)
    private BigDecimal tau5;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
