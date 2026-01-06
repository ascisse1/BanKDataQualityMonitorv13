package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Slf4j
@Component("handleRpaFailureDelegate")
@RequiredArgsConstructor
public class HandleRpaFailureDelegate implements JavaDelegate {

    private final TicketService ticketService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String rpaError = (String) execution.getVariable("rpaErrorMessage");

        log.error("RPA failed for ticket {}: {}", ticketId, rpaError);

        Integer systemUserId = 1;
        ticketService.addComment(
            ticketId,
            systemUserId,
            "RPA automation failed. Error: " + rpaError + ". Manual intervention required.",
            true
        );

        log.info("Manual intervention notification created for ticket: {}", ticketId);
    }
}
