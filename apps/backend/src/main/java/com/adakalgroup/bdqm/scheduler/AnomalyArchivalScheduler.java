package com.adakalgroup.bdqm.scheduler;

import com.adakalgroup.bdqm.repository.AnomalyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Purges old resolved anomalies (CORRECTED, CLOSED, VALIDATED) to keep the table lean.
 * Runs daily at 4:00 AM by default.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnomalyArchivalScheduler {

    private final AnomalyRepository anomalyRepository;

    @Value("${app.archival.retention-days:90}")
    private int retentionDays;

    @Scheduled(cron = "${app.scheduling.archival-cron:0 0 4 * * ?}")
    @Transactional
    public void purgeOldAnomalies() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        log.info("Starting anomaly archival: purging resolved anomalies older than {} ({} days retention)",
                cutoff, retentionDays);

        try {
            int deleted = anomalyRepository.purgeResolvedBefore(cutoff);
            log.info("Anomaly archival completed: {} resolved anomalies purged", deleted);
        } catch (Exception e) {
            log.error("Anomaly archival failed: {}", e.getMessage(), e);
        }
    }
}
