package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.FatcaClient;
import com.bsic.dataqualitybackend.model.enums.ClientType;
import com.bsic.dataqualitybackend.model.enums.FatcaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FatcaClientRepository extends JpaRepository<FatcaClient, Long> {

    Optional<FatcaClient> findByClientNumber(String clientNumber);

    Page<FatcaClient> findByClientType(ClientType clientType, Pageable pageable);

    Page<FatcaClient> findByFatcaStatus(FatcaStatus fatcaStatus, Pageable pageable);

    Page<FatcaClient> findByAgencyCode(String agencyCode, Pageable pageable);

    Page<FatcaClient> findByClientTypeAndFatcaStatus(ClientType clientType, FatcaStatus fatcaStatus, Pageable pageable);

    long countByFatcaStatus(FatcaStatus fatcaStatus);

    long countByClientType(ClientType clientType);

    long countByClientTypeAndFatcaStatus(ClientType clientType, FatcaStatus fatcaStatus);

    long countByUsPerson(Boolean usPerson);

    long countByReportingRequired(Boolean reportingRequired);

    @Query("SELECT f.fatcaStatus as status, COUNT(f) as count " +
           "FROM FatcaClient f " +
           "GROUP BY f.fatcaStatus")
    List<Object[]> countByStatus();

    @Query("SELECT f.riskLevel as riskLevel, COUNT(f) as count " +
           "FROM FatcaClient f " +
           "WHERE f.riskLevel IS NOT NULL " +
           "GROUP BY f.riskLevel " +
           "ORDER BY count DESC")
    List<Object[]> countByRiskLevel();

    @Query("SELECT f.agencyCode as agencyCode, f.agencyName as agencyName, " +
           "COUNT(f) as total, " +
           "SUM(CASE WHEN f.fatcaStatus = 'COMPLIANT' THEN 1 ELSE 0 END) as compliant, " +
           "SUM(CASE WHEN f.fatcaStatus = 'NON_COMPLIANT' THEN 1 ELSE 0 END) as nonCompliant " +
           "FROM FatcaClient f " +
           "GROUP BY f.agencyCode, f.agencyName " +
           "ORDER BY total DESC")
    List<Object[]> getStatsByAgency();
}
