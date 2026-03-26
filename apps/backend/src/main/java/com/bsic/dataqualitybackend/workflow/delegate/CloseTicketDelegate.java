package com.bsic.dataqualitybackend.workflow.delegate;

import com.bsic.dataqualitybackend.model.enums.AnomalyStatus;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.AnomalyRepository;
import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component("closeTicketDelegate")
@RequiredArgsConstructor
public class CloseTicketDelegate implements JavaDelegate {

    private final TicketService ticketService;
    private final AnomalyRepository anomalyRepository;

    @Override
    public void execute(DelegateExecution execution) {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String ticketNumber = (String) execution.getVariable("ticketNumber");
        Long anomalyId = (Long) execution.getVariable("anomalyId");

        log.info("Closing ticket: {}", ticketNumber);

        Integer systemUserId = 1;
        ticketService.updateTicketStatus(
            ticketId,
            TicketStatus.CLOSED,
            systemUserId,
            "Ticket closed successfully. Data updated in CBS."
        );

        if (anomalyId != null) {
            anomalyRepository.findById(anomalyId).ifPresent(anomaly -> {
                anomaly.setStatus(AnomalyStatus.CLOSED);
                anomaly.setCorrectedAt(LocalDateTime.now());
                anomalyRepository.save(anomaly);
                log.info("Anomaly {} status updated to CLOSED", anomalyId);
            });
        }

        execution.setVariable("closedSuccessfully", true);

        log.info("Ticket {} closed successfully", ticketNumber);
    }
}
