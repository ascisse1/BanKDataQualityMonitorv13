package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.User;
import com.bsic.dataqualitybackend.model.enums.TicketPriority;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
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

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        log.info("Creating ticket from workflow...");

        String cli = (String) execution.getVariable("clientId");
        String agencyCode = (String) execution.getVariable("agencyCode");
        String priorityStr = (String) execution.getVariable("priority");
        String initiatorUsername = (String) execution.getVariable("initiator");

        TicketPriority priority = priorityStr != null ?
            TicketPriority.valueOf(priorityStr) : TicketPriority.MEDIUM;

        User initiator = userService.getUserByUsername(initiatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Initiator user not found: " + initiatorUsername));

        Ticket ticket = Ticket.builder()
                .cli(cli)
                .agencyCode(agencyCode)
                .priority(priority)
                .status(TicketStatus.DETECTED)
                .build();

        Ticket createdTicket = ticketService.createTicket(ticket, initiator);

        execution.setVariable("ticketId", createdTicket.getId());
        execution.setVariable("ticketNumber", createdTicket.getTicketNumber());
        execution.setVariable("slaDeadline", createdTicket.getSlaDeadline());

        log.info("Ticket created: {} for client: {} by user: {}", createdTicket.getTicketNumber(), cli, initiatorUsername);
    }
}
