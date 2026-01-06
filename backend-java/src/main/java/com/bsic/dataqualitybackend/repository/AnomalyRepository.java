package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnomalyRepository extends JpaRepository<Anomaly, Long> {

    Page<Anomaly> findByClientType(ClientType clientType, Pageable pageable);

    Page<Anomaly> findByAgencyCode(String agencyCode, Pageable pageable);

    List<Anomaly> findByAgencyCode(String agencyCode);

    Page<Anomaly> findByStatus(AnomalyStatus status, Pageable pageable);

    Page<Anomaly> findByClientTypeAndAgencyCode(ClientType clientType, String agencyCode, Pageable pageable);

    long countByClientType(ClientType clientType);

    long countByStatus(AnomalyStatus status);

    long countByAgencyCode(String agencyCode);

    long countByClientTypeAndStatus(ClientType clientType, AnomalyStatus status);

    @Query("SELECT a.agencyCode as agencyCode, a.agencyName as agencyName, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.clientType = :clientType " +
           "GROUP BY a.agencyCode, a.agencyName " +
           "ORDER BY count DESC")
    List<Object[]> countByAgencyAndClientType(@Param("clientType") ClientType clientType);

    @Query("SELECT a.fieldName as fieldName, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.clientType = :clientType " +
           "GROUP BY a.fieldName " +
           "ORDER BY count DESC")
    List<Object[]> countByFieldNameAndClientType(@Param("clientType") ClientType clientType, Pageable pageable);

    @Query("SELECT DATE(a.createdAt) as date, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.createdAt >= :startDate " +
           "GROUP BY DATE(a.createdAt) " +
           "ORDER BY date DESC")
    List<Object[]> countByCreatedAtAfterGroupByDate(@Param("startDate") LocalDateTime startDate);

    List<Anomaly> findTop10ByOrderByCreatedAtDesc();
}
