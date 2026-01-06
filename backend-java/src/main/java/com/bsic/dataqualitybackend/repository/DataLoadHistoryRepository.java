package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.DataLoadHistory;
import com.bsic.dataqualitybackend.model.enums.LoadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataLoadHistoryRepository extends JpaRepository<DataLoadHistory, Long> {

    Page<DataLoadHistory> findByStatus(LoadStatus status, Pageable pageable);

    Page<DataLoadHistory> findByUploadedBy(String uploadedBy, Pageable pageable);

    List<DataLoadHistory> findByLoadDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT d FROM DataLoadHistory d ORDER BY d.loadDate DESC")
    Page<DataLoadHistory> findAllOrderByLoadDateDesc(Pageable pageable);

    @Query("SELECT SUM(d.recordsProcessed) FROM DataLoadHistory d WHERE d.status = 'COMPLETED'")
    Long getTotalRecordsProcessed();

    @Query("SELECT SUM(d.anomaliesDetected) FROM DataLoadHistory d WHERE d.status = 'COMPLETED'")
    Long getTotalAnomaliesDetected();

    @Query("SELECT COUNT(d) FROM DataLoadHistory d WHERE d.status = :status AND d.loadDate >= :since")
    long countByStatusAndLoadDateAfter(@Param("status") LoadStatus status, @Param("since") LocalDateTime since);
}
