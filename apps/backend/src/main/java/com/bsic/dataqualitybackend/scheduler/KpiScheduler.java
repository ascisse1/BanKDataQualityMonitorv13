package com.bsic.dataqualitybackend.scheduler;

import com.bsic.dataqualitybackend.service.KpiService;
import com.bsic.dataqualitybackend.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class KpiScheduler {

    private final KpiService kpiService;
    private final TicketService ticketService;

    @Scheduled(cron = "0 0 1 * * ?")
    public void calculateDailyKpis() {
        log.info("Running daily KPI calculation job...");

        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            kpiService.calculateDailyKpis(yesterday);

            log.info("Daily KPI calculation completed successfully");

        } catch (Exception e) {
            log.error("Error calculating daily KPIs: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 */15 * * * ?")
    public void checkSlaBreaches() {
        log.info("Running SLA breach check...");

        try {
            ticketService.checkAndUpdateSlaBreaches();
            log.info("SLA breach check completed");

        } catch (Exception e) {
            log.error("Error checking SLA breaches: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void cleanupStuckRpaJobs() {
        log.info("Running stuck RPA jobs cleanup...");
    }
}
