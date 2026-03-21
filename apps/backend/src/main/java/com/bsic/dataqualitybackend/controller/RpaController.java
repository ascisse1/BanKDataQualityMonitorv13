package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.model.RpaJob;
import com.bsic.dataqualitybackend.service.RpaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/rpa")
@RequiredArgsConstructor
public class RpaController {

    private final RpaService rpaService;

    @PostMapping("/jobs/start")
    public ResponseEntity<ApiResponse<Map<String, String>>> startJob(@RequestBody Map<String, Object> request) {
        Long ticketId = ((Number) request.get("ticketId")).longValue();
        String processInstanceId = (String) request.get("processInstanceId");
        String action = (String) request.get("action");

        log.info("Received RPA job start request for ticket: {}", ticketId);

        RpaJob job = rpaService.createJob(ticketId, processInstanceId, action);

        Map<String, String> response = Map.of("jobId", job.getJobId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("RPA job created", response));
    }

    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<Void>> rpaCallback(@RequestBody Map<String, Object> callback) {
        String jobId = (String) callback.get("jobId");
        String status = (String) callback.get("status");
        String errorMessage = (String) callback.get("errorMessage");
        String resultData = callback.get("resultData") != null ?
                callback.get("resultData").toString() : null;

        log.info("Received RPA callback for job: {} - Status: {}", jobId, status);

        rpaService.updateJobStatus(jobId, status, errorMessage, resultData);

        return ResponseEntity.ok(ApiResponse.success("Callback processed", null));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<RpaJob>> getJob(@PathVariable String jobId) {
        RpaJob job = rpaService.getJobById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("RPA job not found: " + jobId));

        return ResponseEntity.ok(ApiResponse.success(job));
    }

    @GetMapping("/jobs/ticket/{ticketId}")
    public ResponseEntity<ApiResponse<List<RpaJob>>> getJobsByTicket(@PathVariable Long ticketId) {
        List<RpaJob> jobs = rpaService.getJobsByTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/jobs/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<RpaJob>>> getJobsByStatus(@PathVariable String status) {
        List<RpaJob> jobs = rpaService.getJobsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @PostMapping("/jobs/{jobId}/retry")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Void>> retryJob(@PathVariable String jobId) {
        rpaService.retryFailedJob(jobId);
        return ResponseEntity.ok(ApiResponse.success("Job retry initiated", null));
    }

    @GetMapping("/jobs/stuck")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RpaJob>>> getStuckJobs(
            @RequestParam(defaultValue = "30") int timeoutMinutes) {
        List<RpaJob> stuckJobs = rpaService.findStuckJobs(timeoutMinutes);
        return ResponseEntity.ok(ApiResponse.success(stuckJobs));
    }

    @PostMapping("/jobs/cleanup-stuck")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cleanupStuckJobs(
            @RequestParam(defaultValue = "30") int timeoutMinutes) {
        rpaService.cleanupStuckJobs(timeoutMinutes);
        return ResponseEntity.ok(ApiResponse.success("Stuck jobs cleaned up", null));
    }
}
