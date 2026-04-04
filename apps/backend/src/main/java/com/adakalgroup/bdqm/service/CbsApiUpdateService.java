package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.AmplitudeApiProperties;
import com.adakalgroup.bdqm.dto.amplitude.CustomerRequest;
import com.adakalgroup.bdqm.dto.amplitude.CustomerResponse;
import com.adakalgroup.bdqm.model.*;
import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.repository.*;
import com.adakalgroup.bdqm.security.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for applying validated corrections to CBS via the Amplitude REST API.
 * Alternative to CbsUpdateService (JDBC direct) — uses the API to benefit from
 * CBS-native historisation (before/after values tracked by Amplitude).
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.amplitude-api.enabled", havingValue = "true")
public class CbsApiUpdateService {

    private final AmplitudeApiClient apiClient;
    private final AmplitudeRequestBuilder requestBuilder;
    private final AmplitudeApiProperties properties;
    private final TicketRepository ticketRepository;
    private final TicketIncidentRepository ticketIncidentRepository;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final ReconciliationTaskRepository reconciliationTaskRepository;
    private final CorrectionRepository correctionRepository;

    public CbsApiUpdateService(
            AmplitudeApiClient apiClient,
            AmplitudeRequestBuilder requestBuilder,
            AmplitudeApiProperties properties,
            TicketRepository ticketRepository,
            TicketIncidentRepository ticketIncidentRepository,
            TicketService ticketService,
            UserRepository userRepository,
            ReconciliationTaskRepository reconciliationTaskRepository,
            CorrectionRepository correctionRepository) {
        this.apiClient = apiClient;
        this.requestBuilder = requestBuilder;
        this.properties = properties;
        this.ticketRepository = ticketRepository;
        this.ticketIncidentRepository = ticketIncidentRepository;
        this.ticketService = ticketService;
        this.userRepository = userRepository;
        this.reconciliationTaskRepository = reconciliationTaskRepository;
        this.correctionRepository = correctionRepository;
    }

    /**
     * Apply validated corrections to CBS via the Amplitude API.
     * Ticket moves to UPDATED_CBS and a reconciliation task is created.
     *
     * @param ticket the validated ticket with corrections to apply
     * @return true if CBS was updated successfully via API
     */
    @Transactional
    public boolean applyCorrections(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.VALIDATED) {
            throw new IllegalStateException(
                    "Ticket must be VALIDATED before applying to CBS. Current status: " + ticket.getStatus());
        }

        String cli = ticket.getCli();
        log.info("Applying corrections to CBS via Amplitude API for ticket {} (client {})",
                ticket.getTicketNumber(), cli);

        // Collect validated incidents into a field→value map
        List<TicketIncident> incidents = ticketIncidentRepository.findByTicketId(ticket.getId());
        List<TicketIncident> validatedIncidents = incidents.stream()
                .filter(i -> "validated".equals(i.getStatus()) || "pending_validation".equals(i.getStatus()))
                .filter(i -> i.getNewValue() != null && !i.getNewValue().isBlank())
                .toList();

        if (validatedIncidents.isEmpty()) {
            log.warn("No validated incidents with new values found for ticket {}", ticket.getTicketNumber());
            return false;
        }

        Map<String, String> corrections = new HashMap<>();
        for (TicketIncident incident : validatedIncidents) {
            corrections.put(incident.getFieldName(), incident.getNewValue());
        }

        log.info("Sending {} corrections to Amplitude API for client {} — fields: {}",
                corrections.size(), cli, corrections.keySet());

        try {
            // Build and send API request
            CustomerRequest request = requestBuilder.buildModifyRequest(cli, corrections);
            CustomerResponse response = apiClient.modifyCustomer(cli, request);

            // API call succeeded (statusCode >= 0)
            log.info("Amplitude API update successful for client {} (responseId: {})",
                    cli, response.getResponseHeader() != null ? response.getResponseHeader().getResponseId() : "N/A");

            // Mark all validated incidents as resolved
            for (TicketIncident incident : validatedIncidents) {
                incident.setStatus("resolved");
                incident.setResolved(true);
                incident.setResolvedAt(LocalDateTime.now());
                ticketIncidentRepository.save(incident);
            }

            // Update ticket status: VALIDATED → UPDATED_CBS
            ticket.setStatus(TicketStatus.UPDATED_CBS);
            ticket.setResolvedIncidents(validatedIncidents.size());
            ticketRepository.save(ticket);

            String apiInfo = response.getResponseHeader() != null
                    ? "responseId=" + response.getResponseHeader().getResponseId()
                    : "";
            addHistoryEntry(ticket, "CBS_UPDATED_VIA_API", TicketStatus.VALIDATED, TicketStatus.UPDATED_CBS,
                    "CBS updated via Amplitude API — fields: " + corrections.keySet() + " " + apiInfo);

            // Create reconciliation task for verification
            createReconciliationTask(ticket, validatedIncidents);

            log.info("CBS updated via API for ticket {}. Awaiting reconciliation before closure.",
                    ticket.getTicketNumber());
            return true;

        } catch (AmplitudeApiClient.AmplitudeApiException e) {
            log.error("Amplitude API error for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
            handleApiFailure(ticket, "Amplitude API error: " + e.getMessage());
            throw e;

        } catch (IllegalArgumentException e) {
            // No fields mapped — configuration issue
            log.error("Field mapping error for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
            handleApiFailure(ticket, "Field mapping error: " + e.getMessage());
            throw new RuntimeException("CBS API update failed: " + e.getMessage(), e);

        } catch (Exception e) {
            log.error("Failed to update CBS via API for ticket {}: {}", ticket.getTicketNumber(), e.getMessage(), e);
            handleApiFailure(ticket, "CBS API update failed: " + e.getMessage());
            throw new RuntimeException("CBS API update failed: " + e.getMessage(), e);
        }
    }

    private void handleApiFailure(Ticket ticket, String reason) {
        ticket.setStatus(TicketStatus.CBS_UPDATE_FAILED);
        ticketRepository.save(ticket);
        addHistoryEntry(ticket, "CBS_API_UPDATE_FAILED", TicketStatus.VALIDATED, TicketStatus.CBS_UPDATE_FAILED, reason);
    }

    private void createReconciliationTask(Ticket ticket, List<TicketIncident> incidents) {
        try {
            ReconciliationTask task = ReconciliationTask.builder()
                    .ticketId(ticket.getTicketNumber())
                    .clientId(ticket.getCli())
                    .status("pending")
                    .attempts(0)
                    .build();
            reconciliationTaskRepository.save(task);

            for (TicketIncident incident : incidents) {
                Correction correction = Correction.builder()
                        .ticketId(ticket.getTicketNumber())
                        .fieldName(incident.getFieldName())
                        .fieldLabel(incident.getFieldName())
                        .oldValue(incident.getOldValue())
                        .newValue(incident.getNewValue())
                        .isMatched(false)
                        .build();
                correctionRepository.save(correction);
            }

            log.info("Reconciliation task created for ticket {} with {} corrections",
                    ticket.getTicketNumber(), incidents.size());
        } catch (Exception e) {
            log.error("Failed to create reconciliation task for ticket {}: {}",
                    ticket.getTicketNumber(), e.getMessage(), e);
            throw new RuntimeException(
                    "CBS updated via API but reconciliation task creation failed — manual verification required. "
                            + e.getMessage(), e);
        }
    }

    private void addHistoryEntry(Ticket ticket, String action, TicketStatus previousStatus,
                                  TicketStatus newStatus, String notes) {
        try {
            User currentUser = SecurityUtils.getCurrentUserLogin()
                    .flatMap(userRepository::findByUsername)
                    .orElse(null);
            ticketService.addHistory(ticket, action, previousStatus, newStatus, null, notes, currentUser);
        } catch (Exception e) {
            log.warn("Failed to add history entry for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
        }
    }
}
