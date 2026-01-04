package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("requestValidationDelegate")
@RequiredArgsConstructor
public class RequestValidationDelegate implements JavaDelegate {

    private final TicketService ticketService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long ticketId = (Long) execution.getVariable("ticketId");
        Integer userId = (Integer) execution.getVariable("assignedUserId");

        log.info("Requesting validation for ticket: {}", ticketId);

        ticketService.updateTicketStatus(
            ticketId,
            TicketStatus.PENDING_VALIDATION,
            userId,
            "Correction completed. Awaiting supervisor validation (4-eyes principle)."
        );

        log.info("Ticket {} moved to PENDING_VALIDATION status", ticketId);
    }
}
