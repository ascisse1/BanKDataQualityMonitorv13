package com.adakalgroup.bdqm.workflow.delegate;

import com.adakalgroup.bdqm.model.Ticket;
import com.adakalgroup.bdqm.model.TicketIncident;
import com.adakalgroup.bdqm.model.User;
import com.adakalgroup.bdqm.model.enums.TicketPriority;
import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.repository.AnomalyRepository;
import com.adakalgroup.bdqm.repository.TicketIncidentRepository;
import com.adakalgroup.bdqm.service.TicketService;
import com.adakalgroup.bdqm.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
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
    public void execute(DelegateExecution execution) {
        log.info("Creating ticket from workflow - processInstanceId: {}", execution.getProcessInstanceId());

        String cli = (String) execution.getVariable("clientId");
        String structureCode = (String) execution.getVariable("structureCode");
        String priorityStr = (String) execution.getVariable("priority");
        String initiatorUsername = (String) execution.getVariable("initiator");
        Long anomalyId = (Long) execution.getVariable("anomalyId");

        String fieldName = (String) execution.getVariable("fieldName");
        String fieldLabel = (String) execution.getVariable("fieldLabel");
        String currentValue = (String) execution.getVariable("currentValue");
        String errorMessage = (String) execution.getVariable("errorMessage");

        TicketPriority priority = priorityStr != null ?
            TicketPriority.valueOf(priorityStr) : TicketPriority.MEDIUM;

        User initiator = userService.getUserByUsername(initiatorUsername)
                .orElseGet(() -> userService.getUserByUsername("admin")
                        .orElseThrow(() -> new IllegalArgumentException("No valid user found for ticket creation")));

        Ticket ticket = Ticket.builder()
                .cli(cli)
                .structureCode(structureCode)
                .priority(priority)
                .status(TicketStatus.DETECTED)
                .totalIncidents(1)
                .resolvedIncidents(0)
                .build();

        Ticket createdTicket = ticketService.createTicket(ticket, initiator);
        log.info("Ticket created: {} for client: {}", createdTicket.getTicketNumber(), cli);

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

        if (anomalyId != null) {
            anomalyRepository.findById(anomalyId).ifPresent(anomaly -> {
                anomaly.setTicketId(createdTicket.getId());
                anomalyRepository.save(anomaly);
                log.info("Anomaly {} linked to ticket {}", anomalyId, createdTicket.getTicketNumber());
            });
        }

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
