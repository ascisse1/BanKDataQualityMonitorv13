package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.Anomaly;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.TicketIncident;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.repository.TicketIncidentRepository;
import com.bsic.dataqualitybackend.service.TicketService;
import com.bsic.dataqualitybackend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("createTicketDelegate")
@RequiredArgsConstructor
public class CreateTicketDelegate implements JavaDelegate {

    private final TicketService ticketService;
    private final UserService userService;
    private final AnomalyRepository anomalyRepository;
    private final TicketIncidentRepository ticketIncidentRepository;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        log.info("Creating ticket from workflow - processInstanceId: {}", execution.getProcessInstanceId());

        // Get workflow variables
        String cli = (String) execution.getVariable("clientId");
        String agencyCode = (String) execution.getVariable("agencyCode");
        String priorityStr = (String) execution.getVariable("priority");
        String initiatorUsername = (String) execution.getVariable("initiator");
        Long anomalyId = (Long) execution.getVariable("anomalyId");

        // Get anomaly details from variables
        String fieldName = (String) execution.getVariable("fieldName");
        String fieldLabel = (String) execution.getVariable("fieldLabel");
        String currentValue = (String) execution.getVariable("currentValue");
        String errorMessage = (String) execution.getVariable("errorMessage");
        String errorType = (String) execution.getVariable("errorType");

        TicketPriority priority = priorityStr != null ?
            TicketPriority.valueOf(priorityStr) : TicketPriority.MEDIUM;

        // Get initiator user (use system user if not found)
        User initiator = userService.getUserByUsername(initiatorUsername)
                .orElseGet(() -> userService.getUserByUsername("admin")
                        .orElseThrow(() -> new IllegalArgumentException("No valid user found for ticket creation")));

        // Create the ticket
        Ticket ticket = Ticket.builder()
                .cli(cli)
                .agencyCode(agencyCode)
                .priority(priority)
                .status(TicketStatus.DETECTED)
                .totalIncidents(1)
                .resolvedIncidents(0)
                .build();

        Ticket createdTicket = ticketService.createTicket(ticket, initiator);
        log.info("Ticket created: {} for client: {}", createdTicket.getTicketNumber(), cli);

        // Create ticket incident from anomaly
        TicketIncident incident = TicketIncident.builder()
                .ticket(createdTicket)
                .incidentType("ANOMALY_DETECTED")
                .category(inferCategory(fieldName))
                .fieldName(fieldName != null ? fieldName : "UNKNOWN")
                .fieldLabel(fieldLabel)
                .oldValue(currentValue)
                .newValue(null)
                .status("pending")
                .resolved(false)
                .notes(errorMessage)
                .build();

        ticketIncidentRepository.save(incident);
        log.info("Ticket incident created for field: {}", fieldName);

        // Link anomaly to ticket
        if (anomalyId != null) {
            anomalyRepository.findById(anomalyId).ifPresent(anomaly -> {
                anomaly.setTicketId(createdTicket.getId());
                anomalyRepository.save(anomaly);
                log.info("Anomaly {} linked to ticket {}", anomalyId, createdTicket.getTicketNumber());
            });
        }

        // Set workflow variables for next steps
        execution.setVariable("ticketId", createdTicket.getId());
        execution.setVariable("ticketNumber", createdTicket.getTicketNumber());
        execution.setVariable("slaDeadline", createdTicket.getSlaDeadline());
        execution.setVariable("ticketCreatedAt", createdTicket.getCreatedAt());
        execution.setVariable("incidentId", incident.getId());

        log.info("CreateTicketDelegate completed - ticket: {}, anomaly: {}",
                createdTicket.getTicketNumber(), anomalyId);
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
}
