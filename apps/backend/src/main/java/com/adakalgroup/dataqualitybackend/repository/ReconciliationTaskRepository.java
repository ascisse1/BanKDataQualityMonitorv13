package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.ReconciliationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReconciliationTaskRepository extends JpaRepository<ReconciliationTask, Long> {

    List<ReconciliationTask> findByStatusIn(List<String> statuses);

    List<ReconciliationTask> findByStatusInOrderByCreatedAtDesc(List<String> statuses);

    @Query("SELECT t FROM ReconciliationTask t WHERE t.status IN :statuses ORDER BY t.createdAt DESC")
    List<ReconciliationTask> findPendingTasks(@Param("statuses") List<String> statuses);

    List<ReconciliationTask> findByTicketId(String ticketId);

    List<ReconciliationTask> findByClientId(String clientId);

    @Query("SELECT t.status as status, COUNT(t) as count FROM ReconciliationTask t GROUP BY t.status")
    List<Object[]> countByStatus();

    @Query("SELECT COUNT(t) FROM ReconciliationTask t WHERE t.status = 'reconciled' AND FUNCTION('DATE', t.reconciledAt) = CURRENT_DATE")
    long countReconciledToday();

    @Query("SELECT COUNT(t) FROM ReconciliationTask t WHERE t.status = 'failed' AND FUNCTION('DATE', t.lastAttemptAt) = CURRENT_DATE")
    long countFailedToday();

    @Query("SELECT COUNT(t) FROM ReconciliationTask t WHERE t.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<String> statuses);

    @Query("SELECT COUNT(t) FROM ReconciliationTask t WHERE t.status = 'abandoned'")
    long countAbandoned();

    @Query("SELECT COUNT(t) FROM ReconciliationTask t WHERE t.status = 'reconciled'")
    long countReconciled();

    @Query("SELECT COUNT(t) FROM ReconciliationTask t")
    long countAll();
}
