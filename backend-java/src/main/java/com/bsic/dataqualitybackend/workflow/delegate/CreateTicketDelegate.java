package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.service.TicketService;
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

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        log.info("Creating ticket from workflow...");

        String cli = (String) execution.getVariable("clientId");
        String agencyCode = (String) execution.getVariable("agencyCode");
        String priorityStr = (String) execution.getVariable("priority");
        TicketPriority priority = priorityStr != null ?
            TicketPriority.valueOf(priorityStr) : TicketPriority.MEDIUM;

        Ticket ticket = Ticket.builder()
                .cli(cli)
                .agencyCode(agencyCode)
                .priority(priority)
                .build();

        Ticket createdTicket = ticketService.createTicket(ticket);

        execution.setVariable("ticketId", createdTicket.getId());
        execution.setVariable("ticketNumber", createdTicket.getTicketNumber());
        execution.setVariable("slaDeadline", createdTicket.getSlaDeadline());

        log.info("Ticket created: {} for client: {}", createdTicket.getTicketNumber(), cli);
    }
}
