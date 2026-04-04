package com.adakalgroup.bdqm.controller;

import com.adakalgroup.bdqm.dto.ApiResponse;
import com.adakalgroup.bdqm.model.Kpi;
import com.adakalgroup.bdqm.service.KpiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;

    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<Kpi>>> getKpisByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Kpi> kpis = kpiService.getKpisByDate(date);
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }

    @GetMapping("/agency/{structureCode}")
    public ResponseEntity<ApiResponse<List<Kpi>>> getKpisByAgency(@PathVariable String structureCode) {
        List<Kpi> kpis = kpiService.getKpisByAgency(structureCode);
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }

    @GetMapping("/agency/{structureCode}/range")
    public ResponseEntity<ApiResponse<List<Kpi>>> getKpisByAgencyAndDateRange(
            @PathVariable String structureCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Kpi> kpis = kpiService.getKpisByDateRange(structureCode, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }

    @GetMapping("/type/{kpiType}/range")
    public ResponseEntity<ApiResponse<List<Kpi>>> getKpisByTypeAndDateRange(
            @PathVariable String kpiType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Kpi> kpis = kpiService.getKpisByTypeAndDateRange(kpiType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }

    @GetMapping("/type/{kpiType}/average")
    public ResponseEntity<ApiResponse<Double>> getAverageKpiValue(
            @PathVariable String kpiType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Double average = kpiService.getAverageKpiValue(kpiType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(average));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardMetrics(
            @RequestParam(required = false) String structureCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        Map<String, Object> metrics = kpiService.getDashboardMetrics(structureCode, targetDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> calculateKpis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        kpiService.calculateDailyKpis(date);
        return ResponseEntity.ok(ApiResponse.success("KPIs calculated successfully", null));
    }
}
