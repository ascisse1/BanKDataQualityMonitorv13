package com.adakalgroup.bdqm.ai.repository;

import com.adakalgroup.bdqm.ai.model.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for AI feedback.
 */
@Repository
public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {

    /**
     * Find feedback for a suggestion.
     */
    List<AiFeedback> findBySuggestionIdOrderByCreatedAtDesc(Long suggestionId);

    /**
     * Find recent feedback for export/retraining.
     */
    List<AiFeedback> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);

    /**
     * Count positive/negative feedback.
     */
    long countByAccepted(Boolean accepted);
}
