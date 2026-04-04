package com.adakalgroup.bdqm.workflow.delegate;

import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("requestValidationDelegate")
@RequiredArgsConstructor
public class RequestValidationDelegate implements JavaDelegate {

    private final TicketService ticketService;

    @Override
    public void execute(DelegateExecution execution) {
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
