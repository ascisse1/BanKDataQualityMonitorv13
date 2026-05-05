package com.adakalgroup.bdqm.ai.model;

import com.adakalgroup.bdqm.ai.model.converter.RiskFactorListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity storing computed risk scores for client records.
 */
@Entity
@Table(name = "ai_risk_scores",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_ai_risk_client_model",
        columnNames = {"client_number", "model_version"}
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_number", nullable = false, length = 50)
    private String clientNumber;

    @Column(name = "risk_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal riskScore;

    @Column(name = "confidence", precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "risk_level", length = 20)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Convert(converter = RiskFactorListConverter.class)
    @Column(name = "risk_factors", columnDefinition = "jsonb")
    private List<RiskFactor> riskFactors;

    @Column(name = "model_version", length = 20)
    private String modelVersion;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (computedAt == null) {
            computedAt = LocalDateTime.now();
        }
    }
}
