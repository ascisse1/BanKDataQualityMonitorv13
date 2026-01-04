package com.bsic.dataqualitybackend.repository;

import com.bsic.dataqualitybackend.model.Kpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface KpiRepository extends JpaRepository<Kpi, Long> {

    List<Kpi> findByPeriodDate(LocalDate periodDate);

    List<Kpi> findByAgencyCode(String agencyCode);

    List<Kpi> findByKpiType(String kpiType);

    Optional<Kpi> findByPeriodDateAndAgencyCodeAndKpiType(LocalDate periodDate, String agencyCode, String kpiType);

    @Query("SELECT k FROM Kpi k WHERE k.periodDate BETWEEN :startDate AND :endDate AND k.agencyCode = :agencyCode ORDER BY k.periodDate")
    List<Kpi> findByAgencyAndDateRange(@Param("agencyCode") String agencyCode,
                                       @Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);

    @Query("SELECT k FROM Kpi k WHERE k.periodDate BETWEEN :startDate AND :endDate AND k.kpiType = :kpiType ORDER BY k.periodDate")
    List<Kpi> findByTypeAndDateRange(@Param("kpiType") String kpiType,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    @Query("SELECT AVG(k.kpiValue) FROM Kpi k WHERE k.kpiType = :kpiType AND k.periodDate BETWEEN :startDate AND :endDate")
    Double getAverageKpiValue(@Param("kpiType") String kpiType,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate);
}
