package com.adakalgroup.dataqualitybackend.repository;

import com.adakalgroup.dataqualitybackend.model.Kpi;
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

    List<Kpi> findByStructureCode(String structureCode);

    List<Kpi> findByKpiType(String kpiType);

    Optional<Kpi> findByPeriodDateAndStructureCodeAndKpiType(LocalDate periodDate, String structureCode, String kpiType);

    @Query("SELECT k FROM Kpi k WHERE k.periodDate BETWEEN :startDate AND :endDate AND k.structureCode = :structureCode ORDER BY k.periodDate")
    List<Kpi> findByAgencyAndDateRange(@Param("structureCode") String structureCode,
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
