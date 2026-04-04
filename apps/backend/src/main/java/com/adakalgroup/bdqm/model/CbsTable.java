package com.adakalgroup.bdqm.model;

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
@Table(schema = "public",name = "cbs_tables", uniqueConstraints = {
    @UniqueConstraint(name = "uk_cbs_table_name", columnNames = "table_name")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CbsTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 30)
    private String tableName;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "schema_name", length = 30)
    private String schemaName;

    @Column(name = "cbs_version", length = 30)
    private String cbsVersion;

    @Column(name = "primary_key_columns", length = 100)
    private String primaryKeyColumns;

    @Column(name = "sync_enabled")
    @Builder.Default
    private Boolean syncEnabled = false;

    @Column(name = "sync_order")
    private Integer syncOrder;

    @Column(name = "validation_enabled")
    @Builder.Default
    private Boolean validationEnabled = false;

    @Column(name = "pk_field", length = 30)
    private String pkField;

    @Column(name = "label_field", length = 100)
    private String labelField;

    @Column(name = "label_field_corporate", length = 100)
    private String labelFieldCorporate;

    @Column(name = "structure_field", length = 30)
    private String structureField;

    @Column(name = "type_field", length = 30)
    private String typeField;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "cbsTable", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CbsField> fields = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
