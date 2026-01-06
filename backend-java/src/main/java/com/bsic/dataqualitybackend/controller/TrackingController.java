package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.DataLoadHistoryRepository;
import com.bsic.dataqualitybackend.repository.FatcaClientRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TrackingController {

    private final AnomalyRepository anomalyRepository;
    private final FatcaClientRepository fatcaClientRepository;
    private final TicketRepository ticketRepository;
    private final DataLoadHistoryRepository dataLoadHistoryRepository;

    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGlobalTracking() {
        Map<String, Object> tracking = new HashMap<>();

        tracking.put("totalAnomalies", anomalyRepository.count());
        tracking.put("totalFatcaClients", fatcaClientRepository.count());
        tracking.put("totalTickets", ticketRepository.count());
        tracking.put("totalDataLoads", dataLoadHistoryRepository.count());

        Long totalRecordsProcessed = dataLoadHistoryRepository.getTotalRecordsProcessed();
        tracking.put("totalRecordsProcessed", totalRecordsProcessed != null ? totalRecordsProcessed : 0L);

        Long totalAnomaliesDetected = dataLoadHistoryRepository.getTotalAnomaliesDetected();
        tracking.put("totalAnomaliesDetected", totalAnomaliesDetected != null ? totalAnomaliesDetected : 0L);

        return ResponseEntity.ok(ApiResponse.success(tracking));
    }
}
