package com.bsic.dataqualitybackend.workflow.delegate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Component("updateKpisDelegate")
@RequiredArgsConstructor
public class UpdateKpisDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String agencyCode = (String) execution.getVariable("agencyCode");
        LocalDateTime slaDeadline = (LocalDateTime) execution.getVariable("slaDeadline");

        log.info("Updating KPIs for ticket: {}", ticketId);

        LocalDateTime now = LocalDateTime.now();
        boolean slaRespected = now.isBefore(slaDeadline);

        Duration resolutionTime = Duration.between(
            (LocalDateTime) execution.getVariable("ticketCreatedAt"),
            now
        );

        execution.setVariable("slaRespected", slaRespected);
        execution.setVariable("resolutionTimeHours", resolutionTime.toHours());

        log.info("KPIs updated for agency {}: SLA Respected={}, Resolution Time={}h",
            agencyCode, slaRespected, resolutionTime.toHours());
    }
}
