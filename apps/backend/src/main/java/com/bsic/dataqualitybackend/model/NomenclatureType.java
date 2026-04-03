package com.bsic.dataqualitybackend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(schema = "public",name = "nomenclature_types", uniqueConstraints = {
    @UniqueConstraint(name = "uk_nomenclature_type_ctab", columnNames = "ctab")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NomenclatureType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ctab", nullable = false, length = 3)
    private String ctab;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sync_enabled")
    @Builder.Default
    private Boolean syncEnabled = true;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "entry_count")
    private Integer entryCount;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @OneToMany(mappedBy = "nomenclatureType", cascade = CascadeType.ALL)
    @Builder.Default
    private List<NomenclatureEntry> entries = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
