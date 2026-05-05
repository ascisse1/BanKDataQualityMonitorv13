package com.adakalgroup.bdqm.ai.model;

import com.adakalgroup.bdqm.ai.model.converter.SuggestionAlternativeListConverter;
import com.adakalgroup.bdqm.model.Anomaly;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity storing ML-generated correction suggestions.
 */
@Entity
@Table(name = "ai_suggestions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anomaly_id", nullable = false)
    private Anomaly anomaly;

    @Column(name = "suggested_value", length = 500)
    private String suggestedValue;

    @Column(name = "confidence", precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "confidence_level", length = 20)
    @Enumerated(EnumType.STRING)
    private ConfidenceLevel confidenceLevel;

    @Column(name = "source", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private SuggestionSource source;

    @Convert(converter = SuggestionAlternativeListConverter.class)
    @Column(name = "alternatives", columnDefinition = "jsonb")
    private List<SuggestionAlternative> alternatives;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "model_version", length = 20)
    private String modelVersion;

    @Column(name = "was_accepted")
    private Boolean wasAccepted;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Record user feedback on this suggestion.
     */
    public void recordFeedback(boolean accepted) {
        this.wasAccepted = accepted;
        this.acceptedAt = LocalDateTime.now();
    }
}
