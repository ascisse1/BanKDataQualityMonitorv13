package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.dto.CorrectionRequest;
import com.bsic.dataqualitybackend.dto.CorrectionResponse;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.TicketIncident;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.TicketIncidentRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CorrectionService {

    private final TicketRepository ticketRepository;
    private final TicketIncidentRepository ticketIncidentRepository;
    private final TicketService ticketService;
    private final WorkflowService workflowService;
    private final UserService userService;
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

        // Create the incident (correction record)
        TicketIncident incident = createIncident(ticket, request);
        ticketIncidentRepository.save(incident);

        // Update ticket incident counts
        ticket.setTotalIncidents(ticket.getTotalIncidents() + 1);
        ticketRepository.save(ticket);

        // Complete the current workflow task (move to 4-Eyes validation)
        if (request.getAction() == CorrectionRequest.CorrectionAction.FIX) {
            try {
                // Complete the AgencyCorrection task - this moves to 4-Eyes validation step
                workflowService.completeCorrectionTask(
                        ticket.getId(),
                        currentUser.getUsername(),
                        request.getFieldName(),
                        request.getOldValue(),
                        request.getNewValue(),
                        request.getNotes()
                );
                log.info("Correction submitted for ticket {} - moved to 4-Eyes validation", ticket.getTicketNumber());
            } catch (Exception e) {
                log.warn("Could not complete workflow task (Camunda may not be configured): {}", e.getMessage());
                // Continue without workflow - manual processing
            }
        }

        // Update status based on action
        updateStatusBasedOnAction(ticket, incident, request.getAction(), currentUser);

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
            ticketIncidentRepository.findByTicket(ticket).forEach(incident -> {
                incident.setStatus("validated");
                ticketIncidentRepository.save(incident);
            });
        } else {
            ticket.setStatus(TicketStatus.REJECTED);
            log.info("Ticket {} rejected by {} - Reason: {}", ticket.getTicketNumber(), validatorUsername, reason);

            // Add rejection comment
            ticketService.addComment(ticketId, validator.getId(), "Rejeté: " + reason, false);

            // Update all incidents to rejected
            ticketIncidentRepository.findByTicket(ticket).forEach(incident -> {
                incident.setStatus("rejected");
                incident.setNotes(reason);
                ticketIncidentRepository.save(incident);
            });
        }

        ticketRepository.save(ticket);

        return CorrectionResponse.builder()
                .ticketId(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .cli(ticket.getCli())
                .ticketStatus(ticket.getStatus())
                .message(approved ? "Correction validée avec succès" : "Correction rejetée: " + reason)
                .requiresValidation(false)
                .build();
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
                .agencyCode(request.getAgencyCode())
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
                // Move ticket to PENDING_VALIDATION (4-Eyes step)
                ticket.setStatus(TicketStatus.PENDING_VALIDATION);
                ticket.setAssignedTo(user);
                ticket.setAssignedAt(LocalDateTime.now());
                incident.setStatus("pending_validation");
                log.info("Ticket {} moved to 4-Eyes validation (PENDING_VALIDATION)", ticket.getTicketNumber());
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

    private CorrectionResponse buildCorrectionResponse(Ticket ticket, TicketIncident incident,
                                                        String processInstanceId, boolean isNewTicket) {
        String message = isNewTicket
                ? "Correction soumise. Ticket créé: " + ticket.getTicketNumber()
                : "Correction ajoutée au ticket existant: " + ticket.getTicketNumber();

        boolean requiresValidation = ticket.getStatus() == TicketStatus.IN_PROGRESS ||
                ticket.getStatus() == TicketStatus.PENDING_VALIDATION;

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
