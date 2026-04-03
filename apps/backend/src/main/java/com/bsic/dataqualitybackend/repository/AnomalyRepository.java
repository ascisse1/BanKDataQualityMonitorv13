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

    Page<Anomaly> findByStructureCode(String structureCode, Pageable pageable);

    List<Anomaly> findByStructureCode(String structureCode);

    Page<Anomaly> findByStatus(AnomalyStatus status, Pageable pageable);

    Page<Anomaly> findByClientTypeAndStructureCode(ClientType clientType, String structureCode, Pageable pageable);

    long countByClientType(ClientType clientType);

    @Query("SELECT COUNT(DISTINCT a.clientNumber) FROM Anomaly a " +
           "WHERE a.clientType = :clientType " +
           "AND a.status NOT IN (com.bsic.dataqualitybackend.model.enums.AnomalyStatus.CORRECTED, " +
           "com.bsic.dataqualitybackend.model.enums.AnomalyStatus.VALIDATED, " +
           "com.bsic.dataqualitybackend.model.enums.AnomalyStatus.CLOSED)")
    long countDistinctClientsWithOpenAnomalies(@Param("clientType") ClientType clientType);

    long countByStatus(AnomalyStatus status);

    long countByStructureCode(String structureCode);

    // Multi-agency (IN clause) variants
    Page<Anomaly> findByStructureCodeIn(List<String> structureCodes, Pageable pageable);

    List<Anomaly> findByStructureCodeIn(List<String> structureCodes);

    Page<Anomaly> findByClientTypeAndStructureCodeIn(ClientType clientType, List<String> structureCodes, Pageable pageable);

    Page<Anomaly> findByStatusAndStructureCodeIn(AnomalyStatus status, List<String> structureCodes, Pageable pageable);

    long countByClientTypeAndStructureCodeIn(ClientType clientType, List<String> structureCodes);

    long countByStatusAndStructureCodeIn(AnomalyStatus status, List<String> structureCodes);

    long countByStructureCodeIn(List<String> structureCodes);

    @Query("SELECT a.structureCode as structureCode, a.structureName as structureName, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.clientType = :clientType AND a.structureCode IN :structureCodes " +
           "GROUP BY a.structureCode, a.structureName " +
           "ORDER BY count DESC")
    List<Object[]> countByAgencyAndClientTypeFiltered(@Param("clientType") ClientType clientType,
                                                      @Param("structureCodes") List<String> structureCodes);

    @Query("SELECT a.structureCode, a.structureName, COUNT(a) " +
           "FROM Anomaly a " +
           "WHERE a.structureCode IN :structureCodes " +
           "GROUP BY a.structureCode, a.structureName " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> countByAgencyGroupedFiltered(@Param("structureCodes") List<String> structureCodes);

    @Query("SELECT a.fieldName as fieldName, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.clientType = :clientType AND a.structureCode IN :structureCodes " +
           "GROUP BY a.fieldName " +
           "ORDER BY count DESC")
    List<Object[]> countByFieldNameAndClientTypeFiltered(@Param("clientType") ClientType clientType,
                                                         @Param("structureCodes") List<String> structureCodes,
                                                         Pageable pageable);

    @Query("SELECT DATE(a.createdAt) as date, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.createdAt >= :startDate AND a.structureCode IN :structureCodes " +
           "GROUP BY DATE(a.createdAt) " +
           "ORDER BY date DESC")
    List<Object[]> countByCreatedAtAfterGroupByDateFiltered(@Param("startDate") LocalDateTime startDate,
                                                            @Param("structureCodes") List<String> structureCodes);

    long countByClientTypeAndStatus(ClientType clientType, AnomalyStatus status);

    @Query("SELECT a.structureCode as structureCode, a.structureName as structureName, COUNT(a) as count " +
           "FROM Anomaly a " +
           "WHERE a.clientType = :clientType " +
           "GROUP BY a.structureCode, a.structureName " +
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

    @Query("SELECT COUNT(a) FROM Anomaly a WHERE a.createdAt >= :since")
    long countCreatedAfter(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM Anomaly a WHERE a.status = :status AND a.updatedAt >= :since")
    long countByStatusUpdatedAfter(@Param("status") AnomalyStatus status, @Param("since") LocalDateTime since);

    /**
     * Check if an open anomaly exists for a client and field.
     * Used to avoid creating duplicate anomalies during sync validation.
     */
    @Query("SELECT COUNT(a) > 0 FROM Anomaly a " +
           "WHERE a.clientNumber = :clientNumber " +
           "AND a.fieldName = :fieldName " +
           "AND a.status NOT IN (com.bsic.dataqualitybackend.model.enums.AnomalyStatus.CLOSED, " +
           "com.bsic.dataqualitybackend.model.enums.AnomalyStatus.VALIDATED)")
    boolean existsOpenAnomalyForClientAndField(@Param("clientNumber") String clientNumber,
                                                @Param("fieldName") String fieldName);

    /**
     * Find all open anomalies for a client.
     */
    List<Anomaly> findByClientNumberAndStatusNotIn(String clientNumber, List<AnomalyStatus> excludedStatuses);

    List<Anomaly> findByClientNumberAndStatusIn(String clientNumber, List<AnomalyStatus> statuses);

    List<Anomaly> findByTicketId(Long ticketId);

    List<Anomaly> findByClientNumber(String clientNumber);

    /**
     * Count anomalies grouped by agency and status for tracking.
     * Returns [structureCode, structureName, status, count]
     */
    @Query("SELECT a.structureCode, a.structureName, a.status, COUNT(a) " +
           "FROM Anomaly a " +
           "GROUP BY a.structureCode, a.structureName, a.status")
    List<Object[]> countByAgencyAndStatusGrouped();

    /**
     * Count anomalies grouped by agency for dashboard.
     * Returns [structureCode, structureName, count]
     */
    @Query("SELECT a.structureCode, a.structureName, COUNT(a) " +
           "FROM Anomaly a " +
           "GROUP BY a.structureCode, a.structureName " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> countByAgencyGrouped();

    /**
     * Find open anomaly by client number and field name for correction updates.
     */
    @Query("SELECT a FROM Anomaly a " +
           "WHERE a.clientNumber = :clientNumber " +
           "AND a.fieldName = :fieldName " +
           "AND a.status NOT IN (com.bsic.dataqualitybackend.model.enums.AnomalyStatus.CLOSED, " +
           "com.bsic.dataqualitybackend.model.enums.AnomalyStatus.VALIDATED) " +
           "ORDER BY a.createdAt DESC")
    List<Anomaly> findOpenAnomalyByClientAndField(@Param("clientNumber") String clientNumber,
                                                   @Param("fieldName") String fieldName);
}
