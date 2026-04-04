package com.adakalgroup.bdqm.repository;

import com.adakalgroup.bdqm.model.CorrectionStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CorrectionStatsRepository extends JpaRepository<CorrectionStats, Long> {

    List<CorrectionStats> findByStructureCode(String structureCode);

    List<CorrectionStats> findByStatsDateBetween(LocalDate startDate, LocalDate endDate);

    List<CorrectionStats> findByWeekNumberAndYearNumber(Integer weekNumber, Integer yearNumber);

    Optional<CorrectionStats> findByStructureCodeAndStatsDate(String structureCode, LocalDate statsDate);

    @Query("SELECT c FROM CorrectionStats c " +
           "WHERE c.weekNumber = :weekNumber AND c.yearNumber = :yearNumber " +
           "ORDER BY c.correctionRate DESC")
    List<CorrectionStats> findByWeekAndYearOrderByRate(
        @Param("weekNumber") Integer weekNumber,
        @Param("yearNumber") Integer yearNumber);

    @Query("SELECT c.structureCode as structureCode, c.structureName as structureName, " +
           "SUM(c.totalAnomalies) as totalAnomalies, " +
           "SUM(c.correctedAnomalies) as correctedAnomalies, " +
           "SUM(c.validatedAnomalies) as validatedAnomalies, " +
           "AVG(c.correctionRate) as avgCorrectionRate " +
           "FROM CorrectionStats c " +
           "WHERE c.statsDate >= :startDate " +
           "GROUP BY c.structureCode, c.structureName " +
           "ORDER BY avgCorrectionRate DESC")
    List<Object[]> getAgencyStatsSummary(@Param("startDate") LocalDate startDate);
}
