package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.BranchAnomalyDto;
import com.adakalgroup.bdqm.dto.DashboardStatsDto;
import com.adakalgroup.bdqm.dto.StatsDto;
import com.adakalgroup.bdqm.dto.ValidationMetricDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds a compact data context string from live stats.
 * Cached in-memory for 10 minutes to avoid DB overhead per chat message.
 * Injected directly into the system prompt so any LLM (even without tool calling) can answer data questions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
public class FaroDataContextService {

    private final StatsService statsService;
    private final StatisticsService statisticsService;

    private volatile String cachedContext;
    private volatile long contextBuiltAt = 0;
    private static final long CONTEXT_TTL_MS = 10 * 60 * 1000; // 10 minutes

    /**
     * Returns a compact data snapshot. Cached for 10 minutes.
     */
    public String getDataContext() {
        long now = System.currentTimeMillis();
        if (cachedContext != null && (now - contextBuiltAt) < CONTEXT_TTL_MS) {
            return cachedContext;
        }
        synchronized (this) {
            if (cachedContext != null && (System.currentTimeMillis() - contextBuiltAt) < CONTEXT_TTL_MS) {
                return cachedContext;
            }
            cachedContext = buildDataContext();
            contextBuiltAt = System.currentTimeMillis();
            log.info("Faro data context refreshed ({} chars)", cachedContext.length());
            return cachedContext;
        }
    }

    private String buildDataContext() {
        StringBuilder ctx = new StringBuilder();
        try {
            DashboardStatsDto d = statsService.getClientStats();
            ctx.append("CLIENTS: ").append(d.getTotal()).append(" total")
               .append(" (Particuliers:").append(d.getIndividual())
               .append(" Entreprises:").append(d.getCorporate())
               .append(" Institutionnels:").append(d.getInstitutional()).append(")")
               .append(" Qualite:").append(String.format("%.1f%%", d.getOverallQualityScore())).append("\n");

            StatsDto s = statisticsService.getGlobalStats();
            ctx.append("ANOMALIES: ").append(s.getTotalAnomalies()).append(" total")
               .append(" (Attente:").append(s.getPendingAnomalies())
               .append(" Corrigees:").append(s.getCorrectedAnomalies())
               .append(" Validees:").append(s.getValidatedAnomalies()).append(")")
               .append(" Taux correction:").append(String.format("%.1f%%", s.getCorrectionRate())).append("\n");

            if (s.getAnomaliesByType() != null) {
                ctx.append("ANOMALIES PAR TYPE: ").append(s.getAnomaliesByType()).append("\n");
            }

            ctx.append("TICKETS: ouverts:").append(d.getPendingTickets())
               .append(" resolus:").append(d.getResolvedTickets()).append("\n");

            List<BranchAnomalyDto> branches = statsService.getAnomaliesByBranch();
            if (branches != null && !branches.isEmpty()) {
                ctx.append("ANOMALIES PAR AGENCE:");
                branches.stream().limit(10).forEach(b ->
                    ctx.append(" ").append(b.getLib_agence()).append(":").append(b.getNombre_anomalies())
                );
                ctx.append("\n");
            }

            List<ValidationMetricDto> metrics = statsService.getValidationMetrics();
            if (metrics != null && !metrics.isEmpty()) {
                ctx.append("QUALITE:");
                metrics.forEach(m ->
                    ctx.append(" ").append(m.getCategory())
                       .append(":").append(m.getTotal_records()).append(" fiches")
                       .append("/").append(m.getValid_records()).append(" valides")
                       .append("(").append(String.format("%.1f%%", m.getQuality_score())).append(")")
                );
                ctx.append("\n");
            }

        } catch (Exception e) {
            log.warn("Failed to build Faro data context: {}", e.getMessage());
            ctx.append("(Donnees en temps reel indisponibles)\n");
        }
        return ctx.toString();
    }
}
