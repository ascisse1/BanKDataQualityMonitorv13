package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.CorrectionStatsDto;
import com.bsic.dataqualitybackend.dto.StatsDto;
import com.bsic.dataqualitybackend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<StatsDto>> getGlobalStats() {
        StatsDto stats = statisticsService.getGlobalStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/agency-correction-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<CorrectionStatsDto>>> getAgencyCorrectionStats() {
        List<CorrectionStatsDto> stats = statisticsService.getAgencyCorrectionStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/correction-stats/weekly")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getValidationMetrics() {
        Map<String, Object> metrics = statisticsService.getValidationMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}
