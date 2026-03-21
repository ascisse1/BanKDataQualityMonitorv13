package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.RpaJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RpaJobRepository extends JpaRepository<RpaJob, Long> {

    Optional<RpaJob> findByJobId(String jobId);

    List<RpaJob> findByTicketId(Long ticketId);

    List<RpaJob> findByStatus(String status);

    @Query("SELECT r FROM RpaJob r WHERE r.status = 'RUNNING' AND r.startedAt < :threshold")
    List<RpaJob> findStuckJobs(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT r FROM RpaJob r WHERE r.status = 'FAILED' AND r.retryCount < :maxRetries")
    List<RpaJob> findRetryableJobs(@Param("maxRetries") Integer maxRetries);

    @Query("SELECT COUNT(r) FROM RpaJob r WHERE r.status = :status AND r.startedAt BETWEEN :startDate AND :endDate")
    long countByStatusAndDateRange(@Param("status") String status,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);
}
