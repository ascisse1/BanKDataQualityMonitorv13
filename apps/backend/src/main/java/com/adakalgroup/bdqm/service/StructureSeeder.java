package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.repository.AnomalyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Seeds the structure table on application startup from existing anomaly data.
 * Ensures the agency filter dropdown is populated even before a CBS sync runs.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StructureSeeder {

    private final AnomalyRepository anomalyRepository;
    private final StructureService structureService;

    @EventListener(ApplicationReadyEvent.class)
    public void seedStructuresFromAnomalies() {
        try {
            var distinctStructures = anomalyRepository.findDistinctStructures();
            if (distinctStructures.isEmpty()) {
                log.info("StructureSeeder: no anomalies found, nothing to seed");
                return;
            }

            int created = 0;
            for (Object[] row : distinctStructures) {
                String code = row[0] != null ? ((String) row[0]).trim() : null;
                String name = row[1] != null ? ((String) row[1]).trim() : null;
                if (code == null || code.isBlank()) continue;

                try {
                    if (structureService.ensureExists(code, name != null ? name : code)) {
                        created++;
                    }
                } catch (Exception e) {
                    log.debug("StructureSeeder: skipped '{}': {}", code, e.getMessage());
                }
            }

            log.info("StructureSeeder: seeded {} new structures from {} distinct anomaly codes",
                    created, distinctStructures.size());
        } catch (Exception e) {
            log.warn("StructureSeeder: failed to seed structures: {}", e.getMessage());
        }
    }
}
