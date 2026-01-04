package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("closeTicketDelegate")
@RequiredArgsConstructor
public class CloseTicketDelegate implements JavaDelegate {

    private final TicketService ticketService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String ticketNumber = (String) execution.getVariable("ticketNumber");

        log.info("Closing ticket: {}", ticketNumber);

        Integer systemUserId = 1;
        ticketService.updateTicketStatus(
            ticketId,
            TicketStatus.CLOSED,
            systemUserId,
            "Ticket closed successfully. Data updated in Amplitude CBS via RPA."
        );

        execution.setVariable("closedSuccessfully", true);

        log.info("Ticket {} closed successfully", ticketNumber);
    }
}
