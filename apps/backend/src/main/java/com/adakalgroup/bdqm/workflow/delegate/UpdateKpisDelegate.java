package com.adakalgroup.bdqm.workflow.delegate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Component("updateKpisDelegate")
@RequiredArgsConstructor
public class UpdateKpisDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        Long ticketId = (Long) execution.getVariable("ticketId");
        String structureCode = (String) execution.getVariable("structureCode");
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
            structureCode, slaRespected, resolutionTime.toHours());
    }
}
