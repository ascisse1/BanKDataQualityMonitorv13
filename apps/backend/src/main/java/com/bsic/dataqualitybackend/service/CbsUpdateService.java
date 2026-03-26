package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.TicketIncident;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.InformixRepository;
import com.bsic.dataqualitybackend.repository.TicketIncidentRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import com.bsic.dataqualitybackend.repository.UserRepository;
import com.bsic.dataqualitybackend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final AnomalyRepository anomalyRepository;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final JdbcTemplate mysqlJdbcTemplate;

    public CbsUpdateService(
            InformixRepository informixRepository,
            TicketRepository ticketRepository,
            TicketIncidentRepository ticketIncidentRepository,
            AnomalyRepository anomalyRepository,
            TicketService ticketService,
            UserRepository userRepository,
            @Qualifier("primaryJdbcTemplate") JdbcTemplate mysqlJdbcTemplate) {
        this.informixRepository = informixRepository;
        this.ticketRepository = ticketRepository;
        this.ticketIncidentRepository = ticketIncidentRepository;
        this.anomalyRepository = anomalyRepository;
        this.ticketService = ticketService;
        this.userRepository = userRepository;
        this.mysqlJdbcTemplate = mysqlJdbcTemplate;
    }

    /**
     * Apply validated corrections to CBS and close the ticket.
     *
     * @param ticket the validated ticket with corrections to apply
     * @return true if CBS was updated and ticket closed successfully
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
                addHistoryEntry(ticket, "CBS_UPDATE_FAILED", TicketStatus.VALIDATED, TicketStatus.VALIDATED,
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

            // Update ticket status: VALIDATED → UPDATED_CBS → CLOSED
            ticket.setStatus(TicketStatus.UPDATED_CBS);
            ticket.setResolvedIncidents(validatedIncidents.size());
            ticketRepository.save(ticket);

            addHistoryEntry(ticket, "CBS_UPDATED", TicketStatus.VALIDATED, TicketStatus.UPDATED_CBS,
                    "CBS updated — fields: " + updates.keySet());

            // Close the ticket
            ticket.setStatus(TicketStatus.CLOSED);
            ticket.setClosedAt(LocalDateTime.now());
            ticketRepository.save(ticket);

            addHistoryEntry(ticket, "TICKET_CLOSED", TicketStatus.UPDATED_CBS, TicketStatus.CLOSED,
                    "Ticket closed after successful CBS update");

            // Close related anomalies
            closeAnomalies(cli, validatedIncidents);

            // Create reconciliation task for CBS verification
            createReconciliationTask(ticket, validatedIncidents);

            log.info("CBS updated and ticket {} closed successfully", ticket.getTicketNumber());
            return true;

        } catch (Exception e) {
            log.error("Failed to update CBS for ticket {}: {}", ticket.getTicketNumber(), e.getMessage(), e);

            addHistoryEntry(ticket, "CBS_UPDATE_FAILED", TicketStatus.VALIDATED, TicketStatus.VALIDATED,
                    "CBS update failed: " + e.getMessage());

            throw new RuntimeException("Failed to update CBS: " + e.getMessage(), e);
        }
    }

    /**
     * Close anomalies related to the corrected fields.
     */
    private void closeAnomalies(String cli, List<TicketIncident> incidents) {
        for (TicketIncident incident : incidents) {
            List<Anomaly> anomalies = anomalyRepository.findOpenAnomalyByClientAndField(cli, incident.getFieldName());
            for (Anomaly anomaly : anomalies) {
                anomaly.setStatus(AnomalyStatus.CLOSED);
                anomalyRepository.save(anomaly);
                log.debug("Closed anomaly {} for client {} field {}", anomaly.getId(), cli, incident.getFieldName());
            }
        }
    }

    /**
     * Creates a reconciliation task and its correction entries after CBS update.
     * This allows users to verify the CBS update was applied correctly.
     */
    private void createReconciliationTask(Ticket ticket, List<TicketIncident> incidents) {
        try {
            // Insert reconciliation task
            mysqlJdbcTemplate.update(
                "INSERT INTO reconciliation_tasks (ticket_id, client_id, status, attempts, created_at) VALUES (?, ?, 'pending', 0, NOW())",
                ticket.getTicketNumber(), ticket.getCli()
            );

            // Insert correction entries for each corrected field
            for (TicketIncident incident : incidents) {
                mysqlJdbcTemplate.update(
                    "INSERT INTO corrections (ticket_id, field_name, field_label, old_value, new_value, is_matched) VALUES (?, ?, ?, ?, ?, false)",
                    ticket.getTicketNumber(),
                    incident.getFieldName(),
                    incident.getFieldName(), // field_label defaults to field_name
                    incident.getOldValue(),
                    incident.getNewValue()
                );
            }

            log.info("Reconciliation task created for ticket {} with {} corrections",
                    ticket.getTicketNumber(), incidents.size());
        } catch (Exception e) {
            log.warn("Failed to create reconciliation task for ticket {}: {}",
                    ticket.getTicketNumber(), e.getMessage());
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
