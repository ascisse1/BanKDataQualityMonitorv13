package com.adakalgroup.bdqm.ai.repository;

import com.adakalgroup.bdqm.ai.model.AiRiskScore;
import com.adakalgroup.bdqm.ai.model.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for AI risk scores.
 */
@Repository
public interface AiRiskScoreRepository extends JpaRepository<AiRiskScore, Long> {

    /**
     * Find latest valid risk score for a client.
     */
    @Query("""
        SELECT r FROM AiRiskScore r
        WHERE r.clientNumber = :clientNumber
        AND (r.expiresAt IS NULL OR r.expiresAt > :now)
        ORDER BY r.computedAt DESC
        LIMIT 1
        """)
    Optional<AiRiskScore> findLatestByClientNumber(
        @Param("clientNumber") String clientNumber,
        @Param("now") LocalDateTime now
    );

    /**
     * Find risk scores for multiple clients.
     */
    @Query("""
        SELECT r FROM AiRiskScore r
        WHERE r.clientNumber IN :clientNumbers
        AND (r.expiresAt IS NULL OR r.expiresAt > :now)
        """)
    List<AiRiskScore> findByClientNumbers(
        @Param("clientNumbers") List<String> clientNumbers,
        @Param("now") LocalDateTime now
    );

    /**
     * Find high-risk records.
     */
    List<AiRiskScore> findByRiskLevelInOrderByRiskScoreDesc(List<RiskLevel> levels);

    /**
     * Count records by risk level.
     */
    long countByRiskLevel(RiskLevel level);

    /**
     * Delete expired scores.
     */
    void deleteByExpiresAtBefore(LocalDateTime threshold);
}
