package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.*;
import com.adakalgroup.bdqm.model.DataLoadHistory;
import com.adakalgroup.bdqm.model.Structure;
import com.adakalgroup.bdqm.model.User;
import com.adakalgroup.bdqm.repository.DataLoadHistoryRepository;
import com.adakalgroup.bdqm.repository.StructureRepository;
import com.adakalgroup.bdqm.repository.UserRepository;
import com.adakalgroup.bdqm.service.StatisticsService;
import com.adakalgroup.bdqm.service.StatsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final StatsService statsService;
    private final StructureRepository structureRepository;
    private final DataLoadHistoryRepository dataLoadHistoryRepository;
    private final UserRepository userRepository;

    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getClientStats() {
        log.info("API: Getting dashboard client stats");
        DashboardStatsDto stats = statsService.getClientStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<StatsDto>> getGlobalStats() {
        StatsDto stats = statisticsService.getGlobalStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/agency-correction-stats")
    public ResponseEntity<ApiResponse<List<CorrectionStatsDto>>> getAgencyCorrectionStats() {
        List<CorrectionStatsDto> stats = statisticsService.getAgencyCorrectionStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/correction-stats/weekly")
    public ResponseEntity<ApiResponse<List<CorrectionStatsDto>>> getWeeklyCorrectionTrend(
            @RequestParam(required = false) Integer weekNumber,
            @RequestParam(required = false) Integer yearNumber) {

        LocalDate now = LocalDate.now();
        int week = weekNumber != null ? weekNumber : now.get(WeekFields.of(Locale.getDefault()).weekOfYear());
        int year = yearNumber != null ? yearNumber : now.getYear();

        List<CorrectionStatsDto> stats = statisticsService.getWeeklyCorrectionTrend(week, year);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/validation-metrics")
    public ResponseEntity<ApiResponse<List<ValidationMetricDto>>> getValidationMetrics() {
        log.info("API: Getting validation metrics by category");
        List<ValidationMetricDto> metrics = statsService.getValidationMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/anomaly-status-counts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnomalyStatusCounts() {
        Map<String, Object> metrics = statisticsService.getValidationMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }


    /**
     * Get anomaly counts grouped by branch/agency.
     */
    @GetMapping("/anomalies/by-branch")
    public ResponseEntity<ApiResponse<List<BranchAnomalyDto>>> getAnomaliesByBranch() {
        log.info("API: Getting anomalies by branch");
        List<BranchAnomalyDto> data = statsService.getAnomaliesByBranch();
        return ResponseEntity.ok(ApiResponse.success(data));
    }


    /**
     * Get recent anomalies for dashboard widget.
     */
    @GetMapping("/recent-anomalies")
    public ResponseEntity<ApiResponse<List<AnomalyDto>>> getRecentAnomalies(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("API: Getting {} recent anomalies", limit);
        List<AnomalyDto> anomalies = statsService.getRecentAnomalies(limit);
        return ResponseEntity.ok(ApiResponse.success(anomalies));
    }

    /**
     * Get quality trends data for charts.
     */
    @GetMapping("/quality-trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getQualityTrends(
            @RequestParam(defaultValue = "6") int months) {
        List<Map<String, Object>> trends = statsService.getQualityTrends(months);
        return ResponseEntity.ok(ApiResponse.success(trends));
    }

    /**
     * Get all agencies/structures for dropdown filters.
     */
    @GetMapping("/agencies")
    public ResponseEntity<ApiResponse<List<Structure>>> getAgencies() {
        List<Structure> agencies = structureRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    /**
     * Get user stats grouped by agency (structure).
     */
    @GetMapping("/user-stats-by-agency")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserStatsByAgency() {
        List<User> users = userRepository.findAll();

        // Group users by role
        Map<String, Long> byRole = users.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                u -> u.getRole() != null ? u.getRole().name() : "UNKNOWN",
                java.util.stream.Collectors.counting()
            ));

        List<Map<String, Object>> result = byRole.entrySet().stream()
            .map(e -> Map.<String, Object>of(
                "structureCode", e.getKey(),
                "structureName", e.getKey(),
                "userCount", e.getValue()
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get data load history for the tracking tab.
     */
    @GetMapping("/data-load-history")
    public ResponseEntity<ApiResponse<List<DataLoadHistory>>> getDataLoadHistory() {
        var page = dataLoadHistoryRepository.findAllOrderByLoadDateDesc(
            PageRequest.of(0, 50, Sort.by("loadDate").descending()));
        return ResponseEntity.ok(ApiResponse.success(page.getContent()));
    }
}
