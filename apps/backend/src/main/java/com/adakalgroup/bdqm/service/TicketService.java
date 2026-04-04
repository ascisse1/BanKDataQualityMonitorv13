package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.config.metrics.BusinessMetricsConfig;
import com.adakalgroup.bdqm.model.*;
import com.adakalgroup.bdqm.model.enums.TicketPriority;
import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.repository.*;
import com.adakalgroup.bdqm.security.StructureSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketIncidentRepository incidentRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketHistoryRepository historyRepository;
    private final DSLContext primaryDsl;
    private final UserRepository userRepository;
    private final BusinessMetricsConfig metricsConfig;
    private final StructureSecurityService structureSecurityService;

    @Transactional
    public Ticket createTicket(Ticket ticket, User createdBy) {
        log.info("Creating new ticket for client: {}", ticket.getCli());

        String ticketNumber = generateTicketNumber();
        ticket.setTicketNumber(ticketNumber);

        // Look up the client name from the bkcli mirror via jOOQ
        Map<String, Object> clientData = primaryDsl.select(DSL.field("nom"), DSL.field("pre"), DSL.field("tcli"))
                .from(DSL.table("cbs.bkcli"))
                .where(DSL.field("cli").eq(ticket.getCli()))
                .fetchOneMap();

        if (clientData == null) {
            throw new IllegalArgumentException("Client not found: " + ticket.getCli());
        }

        String nom = clientData.get("nom") != null ? clientData.get("nom").toString().trim() : "";
        String pre = clientData.get("pre") != null ? clientData.get("pre").toString().trim() : "";
        ticket.setClientName((nom + " " + pre).trim());
        ticket.setClientType(clientData.get("tcli") != null ? clientData.get("tcli").toString().trim() : null);

        LocalDateTime slaDeadline = calculateSlaDeadline(ticket.getPriority());
        ticket.setSlaDeadline(slaDeadline);

        Ticket savedTicket = ticketRepository.save(ticket);

        addHistory(savedTicket, "TICKET_CREATED", null, TicketStatus.DETECTED, null, null, createdBy);

        metricsConfig.recordTicketCreated();
        log.info("Ticket created: {}", ticketNumber);
        return savedTicket;
    }

    public Optional<Ticket> getTicketById(Long id) {
        return ticketRepository.findById(id);
    }

    public Optional<Ticket> getTicketByNumber(String ticketNumber) {
        return ticketRepository.findByTicketNumber(ticketNumber);
    }

    public Page<Ticket> getTicketsByAgency(String structureCode, Pageable pageable) {
        structureSecurityService.requireAgencyAccess(structureCode);
        return ticketRepository.findByStructureCode(structureCode, pageable);
    }

    public Page<Ticket> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable);
    }

    public Page<Ticket> getTicketsByStatus(TicketStatus status, Pageable pageable) {
        return ticketRepository.findByStatus(status, pageable);
    }

    public Page<Ticket> getTicketsByAssignedUser(Integer userId, Pageable pageable) {
        return ticketRepository.findByAssignedUserId(userId, pageable);
    }

    @Transactional
    public Ticket assignTicket(Long ticketId, Integer assignedToUserId, Integer assignedByUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User assignedTo = userRepository.findById(assignedToUserId)
                .orElseThrow(() -> new IllegalArgumentException("Assigned user not found: " + assignedToUserId));

        User assignedBy = userRepository.findById(assignedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("Assigning user not found: " + assignedByUserId));

        TicketStatus previousStatus = ticket.getStatus();

        ticket.setAssignedTo(assignedTo);
        ticket.setAssignedBy(assignedBy);
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.ASSIGNED);

        Ticket updatedTicket = ticketRepository.save(ticket);

        addHistory(updatedTicket, "TICKET_ASSIGNED", previousStatus, TicketStatus.ASSIGNED,
                null, "Assigned to: " + assignedTo.getFullName(), assignedBy);

        log.info("Ticket {} assigned to user {}", ticket.getTicketNumber(), assignedTo.getUsername());
        return updatedTicket;
    }

    @Transactional
    public Ticket updateTicketStatus(Long ticketId, TicketStatus newStatus, Integer userId, String notes) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        TicketStatus previousStatus = ticket.getStatus();

        if (!isValidStatusTransition(previousStatus, newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + previousStatus + " to " + newStatus);
        }

        ticket.setStatus(newStatus);

        if (newStatus == TicketStatus.VALIDATED) {
            ticket.setValidatedBy(user);
            ticket.setValidatedAt(LocalDateTime.now());
        } else if (newStatus == TicketStatus.CLOSED || newStatus == TicketStatus.REJECTED) {
            ticket.setClosedBy(user);
            ticket.setClosedAt(LocalDateTime.now());
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        addHistory(updatedTicket, "STATUS_CHANGED", previousStatus, newStatus, null, notes, user);

        // Record metrics for status changes
        if (newStatus == TicketStatus.VALIDATED) {
            metricsConfig.recordTicketValidated();
        } else if (newStatus == TicketStatus.REJECTED) {
            metricsConfig.recordTicketRejected();
        }

        log.info("Ticket {} status changed from {} to {}", ticket.getTicketNumber(), previousStatus, newStatus);
        return updatedTicket;
    }

    @Transactional
    public TicketComment addComment(Long ticketId, Integer userId, String commentText, Boolean isInternal) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .user(user)
                .comment(commentText)
                .isInternal(isInternal != null ? isInternal : false)
                .build();

        return commentRepository.save(comment);
    }

    public List<TicketIncident> getTicketIncidents(Long ticketId) {
        return incidentRepository.findByTicketId(ticketId);
    }

    public List<TicketComment> getTicketComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }

    public List<TicketHistory> getTicketHistory(Long ticketId) {
        return historyRepository.findByTicketIdOrderByTimestampDesc(ticketId);
    }

    public List<Ticket> getOverdueSlaTickets() {
        return ticketRepository.findOverdueSlaTickets(LocalDateTime.now());
    }

    @Transactional
    public void checkAndUpdateSlaBreaches() {
        List<Ticket> overdueTickets = getOverdueSlaTickets();

        for (Ticket ticket : overdueTickets) {
            if (!ticket.getSlaBreached()) {
                ticket.setSlaBreached(true);
                ticketRepository.save(ticket);
                log.warn("SLA breached for ticket: {}", ticket.getTicketNumber());
            }
        }
    }

    private String generateTicketNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePrefix = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());

        long sequence = ticketRepository.findMaxTicketNumber()
            .map(max -> {
                try {
                    // Extract the sequence part (last 6 digits)
                    String seqPart = max.length() > 6 ? max.substring(max.length() - 6) : max;
                    return Long.parseLong(seqPart) + 1;
                } catch (NumberFormatException e) {
                    return ticketRepository.count() + 1;
                }
            })
            .orElse(1L);

        return datePrefix + String.format("%06d", sequence);
    }

    private LocalDateTime calculateSlaDeadline(TicketPriority priority) {
        int hours;
        switch (priority) {
            case CRITICAL:
                hours = 24;
                break;
            case HIGH:
                hours = 72;
                break;
            case MEDIUM:
                hours = 168;
                break;
            case LOW:
            default:
                hours = 336;
                break;
        }
        return LocalDateTime.now().plusHours(hours);
    }

    private boolean isValidStatusTransition(TicketStatus from, TicketStatus to) {
        switch (from) {
            case DETECTED:
                return to == TicketStatus.ASSIGNED;
            case ASSIGNED:
                return to == TicketStatus.IN_PROGRESS || to == TicketStatus.REJECTED;
            case IN_PROGRESS:
                return to == TicketStatus.PENDING_VALIDATION || to == TicketStatus.REJECTED;
            case PENDING_VALIDATION:
                return to == TicketStatus.VALIDATED || to == TicketStatus.IN_PROGRESS || to == TicketStatus.REJECTED;
            case VALIDATED:
                return to == TicketStatus.UPDATED_CBS;
            case UPDATED_CBS:
                return to == TicketStatus.CLOSED;
            case CLOSED:
            case REJECTED:
                return false;
            default:
                return false;
        }
    }

    public void addHistory(Ticket ticket, String action, TicketStatus previousStatus,
                          TicketStatus newStatus, String previousValue, String notes, User performedBy) {
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .action(action)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .previousValue(previousValue)
                .notes(notes)
                .performedBy(performedBy)
                .build();

        historyRepository.save(history);
    }
}
