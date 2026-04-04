package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.CorrectionRequest;
import com.adakalgroup.bdqm.dto.CorrectionResponse;
import com.adakalgroup.bdqm.model.Anomaly;
import com.adakalgroup.bdqm.model.Ticket;
import com.adakalgroup.bdqm.model.TicketIncident;
import com.adakalgroup.bdqm.model.User;
import com.adakalgroup.bdqm.model.enums.AnomalyStatus;
import com.adakalgroup.bdqm.model.enums.TicketPriority;
import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.config.AmplitudeApiProperties;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import com.adakalgroup.bdqm.repository.TicketIncidentRepository;
import com.adakalgroup.bdqm.repository.TicketRepository;
import com.adakalgroup.bdqm.security.StructureSecurityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class CorrectionService {

    private final TicketRepository ticketRepository;
    private final TicketIncidentRepository ticketIncidentRepository;
    private final AnomalyRepository anomalyRepository;
    private final TicketService ticketService;
    private final WorkflowService workflowService;
    private final UserService userService;
    private final StructureSecurityService structureSecurityService;

    @Autowired(required = false)
    private CbsUpdateService cbsUpdateService;

    @Autowired(required = false)
    private CbsApiUpdateService cbsApiUpdateService;

    @Autowired(required = false)
    private AmplitudeApiProperties amplitudeApiProperties;

    public CorrectionService(TicketRepository ticketRepository,
                             TicketIncidentRepository ticketIncidentRepository,
                             AnomalyRepository anomalyRepository,
                             TicketService ticketService,
                             WorkflowService workflowService,
                             UserService userService,
                             StructureSecurityService structureSecurityService) {
        this.ticketRepository = ticketRepository;
        this.ticketIncidentRepository = ticketIncidentRepository;
        this.anomalyRepository = anomalyRepository;
        this.ticketService = ticketService;
        this.workflowService = workflowService;
        this.userService = userService;
        this.structureSecurityService = structureSecurityService;
    }
    /**
     * Submit a correction for an anomaly.
     * This creates a ticket (or adds to existing) and starts the 4 Eyes validation workflow.
     */
    @Transactional
    public CorrectionResponse submitCorrection(CorrectionRequest request, String currentUserName) {
        log.info("Submitting correction for client {} field {} by user {}",
                request.getCli(), request.getFieldName(), currentUserName);

        var currentUser = userService.getUserByUsername(currentUserName)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserName));

        // Check if there's an existing open ticket for this client
        Optional<Ticket> existingTicket = findOpenTicketForClient(request.getCli());

        Ticket ticket;
        boolean isNewTicket = false;

        if (existingTicket.isPresent()) {
            ticket = existingTicket.get();
            log.info("Adding correction to existing ticket: {}", ticket.getTicketNumber());
        } else {
            // Create a new ticket
            ticket = createTicketForCorrection(request, currentUser);
            isNewTicket = true;
            log.info("Created new ticket: {}", ticket.getTicketNumber());
        }

        // Find existing incident for same field or create a new one
        Optional<TicketIncident> existingIncident = ticketIncidentRepository
                .findOpenByTicketIdAndFieldName(ticket.getId(), request.getFieldName());

        TicketIncident incident;
        if (existingIncident.isPresent()) {
            // Update existing incident with new correction value
            incident = existingIncident.get();
            incident.setNewValue(request.getNewValue());
            incident.setNotes(request.getNotes());
            incident.setStatus("pending");
            log.info("Updating existing incident {} for field {}", incident.getId(), request.getFieldName());
        } else {
            // Create new incident
            incident = createIncident(ticket, request);
            ticket.setTotalIncidents(ticket.getTotalIncidents() + 1);
            ticketRepository.save(ticket);
        }
        ticketIncidentRepository.save(incident);

        // Update status based on action
        updateStatusBasedOnAction(ticket, incident, request.getAction(), currentUser);

        // Update the Anomaly record with the correction value
        if (request.getAction() == CorrectionRequest.CorrectionAction.FIX && request.getNewValue() != null) {
            updateAnomalyWithCorrection(request.getCli(), request.getFieldName(),
                    request.getNewValue(), currentUser.getUsername());
        }

        return buildCorrectionResponse(ticket, incident, ticket.getProcessInstanceId(), isNewTicket);
    }

    /**
     * Get corrections for a specific client
     */
    public List<TicketIncident> getCorrectionsForClient(String cli) {
        List<Ticket> tickets = ticketRepository.findByCli(cli);
        return tickets.stream()
                .flatMap(t -> ticketIncidentRepository.findByTicket(t).stream())
                .toList();
    }

    /**
     * Get pending corrections requiring validation (4 Eyes)
     */
    public List<Ticket> getPendingValidationTickets() {
        return ticketRepository.findByStatus(TicketStatus.PENDING_VALIDATION);
    }

    /**
     * Validate a correction (4 Eyes approval/rejection)
     */
    @Transactional
    public CorrectionResponse validateCorrection(Long ticketId, boolean approved, String reason, String validatorUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        if (ticket.getStatus() != TicketStatus.PENDING_VALIDATION) {
            throw new IllegalStateException("Ticket is not pending validation");
        }

        User validator = userService.getUserByUsername(validatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Validator not found: " + validatorUsername));

        // 4 Eyes check: validator must be different from the person who submitted
        if (ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(validator.getId())) {
            throw new IllegalStateException("4 Eyes Validation: You cannot validate your own corrections");
        }

        ticket.setValidatedBy(validator);
        ticket.setValidatedAt(LocalDateTime.now());

        if (approved) {
            ticket.setStatus(TicketStatus.VALIDATED);
            log.info("Ticket {} validated by {}", ticket.getTicketNumber(), validatorUsername);

            // Update all incidents to validated
            Ticket finalTicket = ticket;
            ticketIncidentRepository.findByTicket(ticket).forEach(incident -> {
                incident.setStatus("validated");
                ticketIncidentRepository.save(incident);

                // Update anomaly status to CORRECTED
                List<Anomaly> anomalies = anomalyRepository.findOpenAnomalyByClientAndField(
                        finalTicket.getCli(), incident.getFieldName());
                for (Anomaly anomaly : anomalies) {
                    anomaly.setStatus(AnomalyStatus.CORRECTED);
                    anomaly.setValidatedBy(validatorUsername);
                    anomaly.setValidatedAt(LocalDateTime.now());
                    anomalyRepository.save(anomaly);
                }
            });

            ticketRepository.save(ticket);

            // Apply corrections to CBS — route to API or JDBC based on configuration
            String cbsMessage = applyCbsUpdate(ticket, ticketId);

            return CorrectionResponse.builder()
                    .ticketId(ticket.getId())
                    .ticketNumber(ticket.getTicketNumber())
                    .cli(ticket.getCli())
                    .ticketStatus(ticket.getStatus())
                    .message(cbsMessage)
                    .requiresValidation(false)
                    .build();
        } else {
            ticket.setStatus(TicketStatus.REJECTED);
            log.info("Ticket {} rejected by {} - Reason: {}", ticket.getTicketNumber(), validatorUsername, reason);

            // Add rejection comment
            ticketService.addComment(ticketId, validator.getId(), "Rejeté: " + reason, false);

            // Update all incidents to rejected
            Ticket finalTicket1 = ticket;
            ticketIncidentRepository.findByTicket(ticket).forEach(incident -> {
                incident.setStatus("rejected");
                incident.setNotes(reason);
                ticketIncidentRepository.save(incident);

                // Reset anomaly status back to PENDING
                List<Anomaly> anomalies = anomalyRepository.findOpenAnomalyByClientAndField(
                        finalTicket1.getCli(), incident.getFieldName());
                for (Anomaly anomaly : anomalies) {
                    anomaly.setStatus(AnomalyStatus.PENDING);
                    anomaly.setCorrectionValue(null);
                    anomaly.setCorrectedBy(null);
                    anomaly.setCorrectedAt(null);
                    anomalyRepository.save(anomaly);
                }
            });

            ticketRepository.save(ticket);

            return CorrectionResponse.builder()
                    .ticketId(ticket.getId())
                    .ticketNumber(ticket.getTicketNumber())
                    .cli(ticket.getCli())
                    .ticketStatus(ticket.getStatus())
                    .message("Correction rejetée: " + reason)
                    .requiresValidation(false)
                    .build();
        }
    }

    private Optional<Ticket> findOpenTicketForClient(String cli) {
        List<Ticket> openTickets = ticketRepository.findByCli(cli).stream()
                .filter(t -> t.getStatus() != TicketStatus.CLOSED &&
                        t.getStatus() != TicketStatus.REJECTED)
                .toList();
        return openTickets.isEmpty() ? Optional.empty() : Optional.of(openTickets.get(0));
    }

    private Ticket createTicketForCorrection(CorrectionRequest request, User currentUser) {
        Ticket ticket = Ticket.builder()
                .cli(request.getCli())
                .structureCode(request.getStructureCode())
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(TicketStatus.DETECTED)
                .totalIncidents(0)
                .resolvedIncidents(0)
                .slaBreached(false)
                .build();

        return ticketService.createTicket(ticket, currentUser);
    }

    private TicketIncident createIncident(Ticket ticket, CorrectionRequest request) {
        String incidentType = switch (request.getAction()) {
            case FIX -> "CORRECTION";
            case REVIEW -> "REVIEW_REQUEST";
            case REJECT -> "REJECTION";
        };

        return TicketIncident.builder()
                .ticket(ticket)
                .incidentType(incidentType)
                .category(inferCategory(request.getFieldName()))
                .fieldName(request.getFieldName())
                .fieldLabel(request.getFieldLabel())
                .oldValue(request.getOldValue())
                .newValue(request.getNewValue())
                .status("pending")
                .resolved(false)
                .notes(request.getNotes())
                .build();
    }

    private void updateStatusBasedOnAction(Ticket ticket, TicketIncident incident,
                                           CorrectionRequest.CorrectionAction action, User user) {
        switch (action) {
            case FIX:
                // Mark this incident as corrected
                incident.setIncidentType("CORRECTION");
                incident.setStatus("corrected");
                ticket.setAssignedTo(user);
                ticket.setAssignedAt(LocalDateTime.now());

                // Check if ALL incidents for this ticket are now corrected
                if (allIncidentsCorrected(ticket, incident)) {
                    // All fields corrected — move to 4-Eyes validation
                    ticket.setStatus(TicketStatus.PENDING_VALIDATION);
                    markAllIncidentsPendingValidation(ticket, incident);
                    log.info("All incidents corrected for ticket {} — moved to 4-Eyes validation", ticket.getTicketNumber());

                    // Complete the BPMN workflow task
                    try {
                        workflowService.completeCorrectionTask(
                                ticket.getId(),
                                user.getUsername(),
                                incident.getFieldName(),
                                incident.getOldValue(),
                                incident.getNewValue(),
                                incident.getNotes()
                        );
                    } catch (Exception e) {
                        log.warn("Could not complete workflow task: {}", e.getMessage());
                    }
                } else {
                    // Still pending corrections on other fields — keep IN_PROGRESS
                    ticket.setStatus(TicketStatus.IN_PROGRESS);
                    long totalIncidents = ticketIncidentRepository.findByTicket(ticket).size();
                    long corrected = ticketIncidentRepository.findByTicket(ticket).stream()
                            .filter(i -> "corrected".equals(i.getStatus()) || "pending_validation".equals(i.getStatus()))
                            .count();
                    // Count the current incident being saved
                    if (incident.getId() == null || !"corrected".equals(incident.getStatus())) {
                        corrected++;
                    }
                    log.info("Ticket {} — {}/{} incidents corrected, waiting for remaining",
                            ticket.getTicketNumber(), corrected, totalIncidents);
                }
                break;

            case REVIEW:
                ticket.setStatus(TicketStatus.ASSIGNED);
                incident.setStatus("in_review");
                break;

            case REJECT:
                incident.setStatus("rejected");
                incident.setResolved(true);
                incident.setResolvedAt(LocalDateTime.now());
                ticket.setResolvedIncidents(ticket.getResolvedIncidents() + 1);
                break;
        }

        ticketRepository.save(ticket);
        ticketIncidentRepository.save(incident);
    }

    /**
     * Check if all incidents for a ticket are corrected.
     * Considers the current incident (not yet saved) as corrected.
     */
    private boolean allIncidentsCorrected(Ticket ticket, TicketIncident currentIncident) {
        List<TicketIncident> allIncidents = ticketIncidentRepository.findByTicket(ticket);

        for (TicketIncident inc : allIncidents) {
            // Skip the current incident being corrected
            if (currentIncident.getId() != null && inc.getId().equals(currentIncident.getId())) {
                continue;
            }
            // Skip already resolved (rejected) incidents
            if (inc.getResolved() != null && inc.getResolved()) {
                continue;
            }
            // If any other incident is not yet corrected, return false
            if (!"corrected".equals(inc.getStatus()) && !"pending_validation".equals(inc.getStatus())) {
                return false;
            }
        }
        return true;
    }

    /**
     * Mark all corrected incidents as pending_validation when ticket moves to validation.
     */
    private void markAllIncidentsPendingValidation(Ticket ticket, TicketIncident currentIncident) {
        List<TicketIncident> allIncidents = ticketIncidentRepository.findByTicket(ticket);
        for (TicketIncident inc : allIncidents) {
            if ("corrected".equals(inc.getStatus())) {
                inc.setStatus("pending_validation");
                ticketIncidentRepository.save(inc);
            }
        }
        currentIncident.setStatus("pending_validation");
    }

    /**
     * Update the Anomaly record with the correction value.
     * This ensures the correctionValue is displayed in the anomalies list.
     */
    private void updateAnomalyWithCorrection(String clientNumber, String fieldName,
                                              String newValue, String correctedBy) {
        List<Anomaly> anomalies = anomalyRepository.findOpenAnomalyByClientAndField(clientNumber, fieldName);

        if (!anomalies.isEmpty()) {
            Anomaly anomaly = anomalies.get(0); // Get the most recent one
            anomaly.setCorrectionValue(newValue);
            anomaly.setCorrectedBy(correctedBy);
            anomaly.setCorrectedAt(LocalDateTime.now());
            anomaly.setStatus(AnomalyStatus.IN_PROGRESS); // Mark as in progress (pending 4-Eyes validation)
            anomalyRepository.save(anomaly);
            log.info("Updated anomaly {} with correction value: {}", anomaly.getId(), newValue);
        } else {
            log.warn("No open anomaly found for client {} field {} to update with correction",
                    clientNumber, fieldName);
        }
    }

    private String inferCategory(String fieldName) {
        if (fieldName == null) return "OTHER";

        return switch (fieldName.toLowerCase()) {
            case "nid", "tid", "vid" -> "IDENTITY";
            case "nom", "pre", "rso" -> "IDENTIFICATION";
            case "dna", "datc" -> "DATE";
            case "nat", "nmer" -> "CIVIL_STATUS";
            case "nrc", "sec", "fju" -> "REGISTRATION";
            case "email", "telephone" -> "CONTACT";
            default -> "OTHER";
        };
    }

    /**
     * Route CBS update to API or JDBC based on configuration.
     * If API is enabled, try API first. If API fails and fallback-jdbc is enabled, fall back to JDBC.
     */
    private String applyCbsUpdate(Ticket ticket, Long ticketId) {
        // Try Amplitude API first if enabled
        if (cbsApiUpdateService != null) {
            try {
                boolean cbsUpdated = cbsApiUpdateService.applyCorrections(ticket);
                ticket = ticketRepository.findById(ticketId).orElse(ticket);
                if (cbsUpdated) {
                    return "Correction validée et appliquée au CBS via API Amplitude. En attente de réconciliation.";
                } else {
                    return "Correction validée. Mise à jour CBS via API échouée (client introuvable)";
                }
            } catch (Exception e) {
                log.error("CBS API update failed for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
                ticket = ticketRepository.findById(ticketId).orElse(ticket);

                // Fall back to JDBC if configured
                if (amplitudeApiProperties != null && amplitudeApiProperties.isFallbackJdbc() && cbsUpdateService != null) {
                    log.info("Falling back to JDBC for ticket {} after API failure", ticket.getTicketNumber());
                    return applyCbsUpdateJdbc(ticket, ticketId);
                }
                return "Correction validée. Erreur API Amplitude: " + e.getMessage();
            }
        }

        // Direct JDBC if no API configured
        if (cbsUpdateService != null) {
            return applyCbsUpdateJdbc(ticket, ticketId);
        }

        log.info("CBS integration not enabled — ticket {} validated but CBS not updated", ticket.getTicketNumber());
        return "Correction validée avec succès";
    }

    private String applyCbsUpdateJdbc(Ticket ticket, Long ticketId) {
        try {
            boolean cbsUpdated = cbsUpdateService.applyCorrections(ticket);
            ticket = ticketRepository.findById(ticketId).orElse(ticket);
            if (cbsUpdated) {
                return "Correction validée et appliquée au CBS (JDBC). En attente de réconciliation.";
            } else {
                return "Correction validée. Mise à jour CBS échouée (client introuvable dans le CBS)";
            }
        } catch (Exception e) {
            log.error("CBS JDBC update failed for ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
            ticket = ticketRepository.findById(ticketId).orElse(ticket);
            return "Correction validée. Erreur lors de la mise à jour CBS: " + e.getMessage();
        }
    }

    private CorrectionResponse buildCorrectionResponse(Ticket ticket, TicketIncident incident,
                                                        String processInstanceId, boolean isNewTicket) {
        String message;
        if (ticket.getStatus() == TicketStatus.PENDING_VALIDATION) {
            message = "Toutes les corrections soumises. En attente de validation superviseur (4 Eyes). Ticket: " + ticket.getTicketNumber();
        } else if (isNewTicket) {
            message = "Correction soumise. Ticket créé: " + ticket.getTicketNumber() + ". D'autres champs restent à corriger.";
        } else {
            message = "Correction enregistrée pour le ticket: " + ticket.getTicketNumber() + ". D'autres champs restent à corriger.";
        }

        boolean requiresValidation = ticket.getStatus() == TicketStatus.PENDING_VALIDATION;

        return CorrectionResponse.builder()
                .correctionId(incident.getId())
                .ticketId(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .cli(ticket.getCli())
                .fieldName(incident.getFieldName())
                .fieldLabel(incident.getFieldLabel())
                .oldValue(incident.getOldValue())
                .newValue(incident.getNewValue())
                .ticketStatus(ticket.getStatus())
                .incidentStatus(incident.getStatus())
                .processInstanceId(processInstanceId)
                .createdAt(incident.getCreatedAt())
                .message(message)
                .requiresValidation(requiresValidation)
                .assignedToUser(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : null)
                .slaDeadline(ticket.getSlaDeadline())
                .build();
    }
}
