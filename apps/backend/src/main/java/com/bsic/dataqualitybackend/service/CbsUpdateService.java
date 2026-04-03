package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.*;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.*;
import com.bsic.dataqualitybackend.security.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for applying validated corrections directly to CBS (Informix)
 * via JDBC.
 *
 * Audit trail is maintained through:
 * - TicketIncident: oldValue/newValue for each field
 * - TicketHistory: CBS_UPDATED action with timestamp
 * - Anomaly: correctedBy, correctedAt, validatedBy, validatedAt
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.features.informix-integration", havingValue = "true", matchIfMissing = false)
public class CbsUpdateService {

    private final InformixRepository informixRepository;
    private final TicketRepository ticketRepository;
    private final TicketIncidentRepository ticketIncidentRepository;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final ReconciliationTaskRepository reconciliationTaskRepository;
    private final CorrectionRepository correctionRepository;

    public CbsUpdateService(
            InformixRepository informixRepository,
            TicketRepository ticketRepository,
            TicketIncidentRepository ticketIncidentRepository,
            TicketService ticketService,
            UserRepository userRepository,
            ReconciliationTaskRepository reconciliationTaskRepository,
            CorrectionRepository correctionRepository) {
        this.informixRepository = informixRepository;
        this.ticketRepository = ticketRepository;
        this.ticketIncidentRepository = ticketIncidentRepository;
        this.ticketService = ticketService;
        this.userRepository = userRepository;
        this.reconciliationTaskRepository = reconciliationTaskRepository;
        this.correctionRepository = correctionRepository;
    }

    /**
     * Apply validated corrections to CBS.
     * Ticket moves to UPDATED_CBS and a reconciliation task is created.
     * Ticket closure happens after successful reconciliation (see ReconciliationService).
     *
     * @param ticket the validated ticket with corrections to apply
     * @return true if CBS was updated successfully
     */
    @Transactional
    public boolean applyCorrections(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.VALIDATED) {
            throw new IllegalStateException("Ticket must be VALIDATED before applying to CBS. Current status: " + ticket.getStatus());
        }

        String cli = ticket.getCli();
        log.info("Applying corrections to CBS for ticket {} (client {})", ticket.getTicketNumber(), cli);

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

        Map<String, Object> updates = new HashMap<>();
        for (TicketIncident incident : validatedIncidents) {
            updates.put(incident.getFieldName(), incident.getNewValue());
        }

        log.info("Updating CBS for client {} — fields: {}", cli, updates.keySet());

        try {
            // Update CBS (Informix)
            boolean updated = informixRepository.updateClient(cli, updates);

            if (!updated) {
                log.error("CBS update returned 0 rows affected for client {}", cli);
                ticket.setStatus(TicketStatus.CBS_UPDATE_FAILED);
                ticketRepository.save(ticket);
                addHistoryEntry(ticket, "CBS_UPDATE_FAILED", TicketStatus.VALIDATED, TicketStatus.CBS_UPDATE_FAILED,
                        "CBS update failed: client not found in CBS");
                return false;
            }

            // Mark all validated incidents as resolved
            for (TicketIncident incident : validatedIncidents) {
                incident.setStatus("resolved");
                incident.setResolved(true);
                incident.setResolvedAt(LocalDateTime.now());
                ticketIncidentRepository.save(incident);
            }

            // Update ticket status: VALIDATED → UPDATED_CBS
            // Ticket stays UPDATED_CBS until reconciliation confirms success
            ticket.setStatus(TicketStatus.UPDATED_CBS);
            ticket.setResolvedIncidents(validatedIncidents.size());
            ticketRepository.save(ticket);

            addHistoryEntry(ticket, "CBS_UPDATED", TicketStatus.VALIDATED, TicketStatus.UPDATED_CBS,
                    "CBS updated — fields: " + updates.keySet());

            // Create reconciliation task for CBS verification
            // This must succeed — if it fails, the CBS update cannot be verified
            createReconciliationTask(ticket, validatedIncidents);

            log.info("CBS updated for ticket {}. Awaiting reconciliation before closure.", ticket.getTicketNumber());
            return true;

        } catch (Exception e) {
            log.error("Failed to update CBS for ticket {}: {}", ticket.getTicketNumber(), e.getMessage(), e);

            ticket.setStatus(TicketStatus.CBS_UPDATE_FAILED);
            ticketRepository.save(ticket);
            addHistoryEntry(ticket, "CBS_UPDATE_FAILED", TicketStatus.VALIDATED, TicketStatus.CBS_UPDATE_FAILED,
                    "CBS update failed: " + e.getMessage());

            throw new RuntimeException("Failed to update CBS: " + e.getMessage(), e);
        }
    }

    // Anomaly closure is now handled by ReconciliationService.closeTicketAfterReconciliation()
    // after CBS update is verified, not immediately after the update.

    /**
     * Creates a reconciliation task and its correction entries after CBS update.
     * This allows users to verify the CBS update was applied correctly.
     */
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
            throw new RuntimeException("CBS updated but reconciliation task creation failed — manual verification required. " + e.getMessage(), e);
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
