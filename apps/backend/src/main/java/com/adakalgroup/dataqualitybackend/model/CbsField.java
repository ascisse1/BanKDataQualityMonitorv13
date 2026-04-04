package com.adakalgroup.dataqualitybackend.model;

import com.adakalgroup.dataqualitybackend.model.enums.CbsDataType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table( schema = "public", name = "cbs_fields", uniqueConstraints = {
    @UniqueConstraint(name = "uk_cbs_field_table_column", columnNames = {"cbs_table_id", "column_name"})
}, indexes = {
    @Index(name = "idx_cbs_field_table", columnList = "cbs_table_id"),
    @Index(name = "idx_cbs_field_nomenclature", columnList = "nomenclature_ctab")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CbsField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cbs_table_id", nullable = false)
    private CbsTable cbsTable;

    @Column(name = "column_name", nullable = false, length = 30)
    private String columnName;

    @Column(name = "display_label", length = 100)
    private String displayLabel;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "query_alias", length = 50)
    private String queryAlias;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 20)
    private CbsDataType dataType;

    @Column(name = "max_length")
    private Integer maxLength;

    @Column(name = "precision_value")
    private Integer precisionValue;

    @Column(name = "scale_value")
    private Integer scaleValue;

    @Column(name = "is_primary_key")
    @Builder.Default
    private Boolean isPrimaryKey = false;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    @Column(name = "is_updatable")
    @Builder.Default
    private Boolean isUpdatable = true;

    @Column(name = "nomenclature_ctab", length = 3)
    private String nomenclatureCtab;

    @Column(name = "nomenclature_description", length = 100)
    private String nomenclatureDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "enum_values", columnDefinition = "JSONB")
    private String enumValues;

    @Column(name = "applicable_client_types", length = 50)
    private String applicableClientTypes;

    @Column(name = "api_field_path", length = 200)
    private String apiFieldPath;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "field_group", length = 50)
    private String fieldGroup;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
