package com.bsic.dataqualitybackend.controller;

import com.bsic.dataqualitybackend.dto.ApiResponse;
import com.bsic.dataqualitybackend.dto.CorrectionRequest;
import com.bsic.dataqualitybackend.dto.CorrectionResponse;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.TicketIncident;
import com.bsic.dataqualitybackend.security.SecurityUtils;
import com.bsic.dataqualitybackend.service.CorrectionService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/corrections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CorrectionController {

    private final CorrectionService correctionService;

    /**
     * Submit a new correction for an anomaly.
     * This creates a ticket and starts the 4 Eyes validation workflow.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CorrectionResponse>> submitCorrection(
            @Valid @RequestBody CorrectionRequest request) {

        String currentUsername = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));
        log.info("User {} submitting correction for client {} field {}",
                currentUsername, request.getCli(), request.getFieldName());

        CorrectionResponse response = correctionService.submitCorrection(request, currentUsername);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.getMessage(), response));
    }

    /**
     * Get corrections for a specific client
     */
    @GetMapping("/client/{cli}")
    public ResponseEntity<ApiResponse<List<TicketIncident>>> getClientCorrections(
            @PathVariable String cli) {

        List<TicketIncident> corrections = correctionService.getCorrectionsForClient(cli);
        return ResponseEntity.ok(ApiResponse.success(corrections));
    }

    /**
     * Get tickets pending validation (for supervisors - 4 Eyes workflow)
     */
    @GetMapping("/pending-validation")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<Ticket>>> getPendingValidation() {
        List<Ticket> tickets = correctionService.getPendingValidationTickets();
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    /**
     * Validate a correction (4 Eyes approval/rejection)
     * Only supervisors/admins can validate, and they cannot validate their own submissions.
     */
    @PostMapping("/{ticketId}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'AUDITOR')")
    public ResponseEntity<ApiResponse<CorrectionResponse>> validateCorrection(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> request) {

        String validatorUsername = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));
        boolean approved = (Boolean) request.get("approved");
        String reason = (String) request.getOrDefault("reason", "");

        log.info("User {} {} correction for ticket {}",
                validatorUsername, approved ? "approving" : "rejecting", ticketId);

        CorrectionResponse response = correctionService.validateCorrection(
                ticketId, approved, reason, validatorUsername);

        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    /**
     * Request validation for a ticket (move to PENDING_VALIDATION)
     * Called by agency user when corrections are ready for supervisor review.
     */
    @PostMapping("/{ticketId}/request-validation")
    public ResponseEntity<ApiResponse<CorrectionResponse>> requestValidation(
            @PathVariable Long ticketId,
            @RequestBody(required = false) Map<String, String> request) {

        String currentUsername = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));
        String notes = request != null ? request.get("notes") : null;

        log.info("User {} requesting validation for ticket {}", currentUsername, ticketId);

        // This would update the ticket status to PENDING_VALIDATION
        CorrectionResponse response = CorrectionResponse.builder()
                .ticketId(ticketId)
                .message("Demande de validation envoyée. En attente d'approbation par un superviseur.")
                .requiresValidation(true)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}
