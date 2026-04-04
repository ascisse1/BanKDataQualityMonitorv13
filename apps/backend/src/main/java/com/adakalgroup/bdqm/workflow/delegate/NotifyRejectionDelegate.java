package com.adakalgroup.bdqm.workflow.delegate;

import com.adakalgroup.bdqm.model.enums.TicketStatus;
import com.adakalgroup.bdqm.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("notifyRejectionDelegate")
@RequiredArgsConstructor
public class NotifyRejectionDelegate implements JavaDelegate {

    private final TicketService ticketService;

    @Override
    public void execute(DelegateExecution execution) {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String rejectionReason = (String) execution.getVariable("rejectionReason");
        Integer validatorId = (Integer) execution.getVariable("validatorId");

        log.info("Notifying rejection for ticket: {}", ticketId);

        String notes = "Validation rejected. Reason: " +
            (rejectionReason != null ? rejectionReason : "No reason provided");

        ticketService.updateTicketStatus(
            ticketId,
            TicketStatus.IN_PROGRESS,
            validatorId,
            notes
        );

        ticketService.addComment(
            ticketId,
            validatorId,
            notes,
            false
        );

        log.info("Ticket {} returned to agency user for rework", ticketId);
    }
}
