package com.adakalgroup.bdqm.ai.repository;

import com.adakalgroup.bdqm.ai.model.AiSuggestion;
import com.adakalgroup.bdqm.ai.model.SuggestionSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for AI suggestions.
 */
@Repository
public interface AiSuggestionRepository extends JpaRepository<AiSuggestion, Long> {

    /**
     * Find latest suggestion for an anomaly.
     */
    Optional<AiSuggestion> findFirstByAnomalyIdOrderByCreatedAtDesc(Long anomalyId);

    /**
     * Find suggestions for multiple anomalies.
     */
    @Query("""
        SELECT s FROM AiSuggestion s
        WHERE s.anomaly.id IN :anomalyIds
        AND s.createdAt = (
            SELECT MAX(s2.createdAt) FROM AiSuggestion s2
            WHERE s2.anomaly.id = s.anomaly.id
        )
        """)
    List<AiSuggestion> findLatestByAnomalyIds(@Param("anomalyIds") List<Long> anomalyIds);

    /**
     * Find suggestions pending feedback.
     */
    List<AiSuggestion> findByWasAcceptedIsNullOrderByCreatedAtDesc();

    /**
     * Find accepted suggestions for retraining.
     */
    @Query("""
        SELECT s FROM AiSuggestion s
        WHERE s.wasAccepted = true
        AND s.acceptedAt >= :since
        AND s.source = :source
        """)
    List<AiSuggestion> findAcceptedSince(
        @Param("since") LocalDateTime since,
        @Param("source") SuggestionSource source
    );

    /**
     * Count suggestions by acceptance status.
     */
    long countByWasAccepted(Boolean accepted);

    /**
     * Calculate acceptance rate.
     */
    @Query("""
        SELECT CAST(COUNT(CASE WHEN s.wasAccepted = true THEN 1 END) AS double) /
               NULLIF(COUNT(CASE WHEN s.wasAccepted IS NOT NULL THEN 1 END), 0)
        FROM AiSuggestion s
        WHERE s.createdAt >= :since
        """)
    Double calculateAcceptanceRateSince(@Param("since") LocalDateTime since);
}
