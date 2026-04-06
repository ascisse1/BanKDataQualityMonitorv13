package com.adakalgroup.bdqm.service;

import com.adakalgroup.bdqm.dto.BranchAnomalyDto;
import com.adakalgroup.bdqm.dto.DashboardStatsDto;
import com.adakalgroup.bdqm.dto.StatsDto;
import com.adakalgroup.bdqm.dto.ValidationMetricDto;
import com.adakalgroup.bdqm.model.ValidationRule;
import com.adakalgroup.bdqm.repository.ValidationRuleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds a structured data context from live stats for Faro's system prompt.
 * Cached in-memory for 5 minutes.
 * Clear, line-by-line format so the LLM can parse numbers without ambiguity.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
public class FaroDataContextService {

    private final StatsService statsService;
    private final StatisticsService statisticsService;
    private final ValidationRuleRepository validationRuleRepository;

    private volatile String cachedContext;
    private volatile long contextBuiltAt = 0;
    private static final long CONTEXT_TTL_MS = 5 * 60 * 1000; // 5 minutes

    public FaroDataContextService(StatsService statsService, StatisticsService statisticsService,
                                  ValidationRuleRepository validationRuleRepository) {
        this.statsService = statsService;
        this.statisticsService = statisticsService;
        this.validationRuleRepository = validationRuleRepository;
    }

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
            log.info("Faro data context refreshed:\n{}", cachedContext);
            return cachedContext;
        }
    }

    /**
     * Force refresh (for testing or after data changes).
     */
    public void invalidate() {
        cachedContext = null;
        contextBuiltAt = 0;
    }

    private String buildDataContext() {
        StringBuilder ctx = new StringBuilder();
        try {
            // --- CLIENTS ---
            DashboardStatsDto d = statsService.getClientStats();
            ctx.append("[CLIENTS]\n");
            ctx.append("Total clients = ").append(d.getTotal()).append("\n");
            ctx.append("Particuliers = ").append(d.getIndividual()).append("\n");
            ctx.append("Entreprises = ").append(d.getCorporate()).append("\n");
            ctx.append("Institutionnels = ").append(d.getInstitutional()).append("\n");
            ctx.append("Score qualite global = ").append(String.format("%.1f", d.getOverallQualityScore())).append("%\n");
            ctx.append("\n");

            // --- ANOMALIES ---
            StatsDto s = statisticsService.getGlobalStats();
            ctx.append("[ANOMALIES]\n");
            ctx.append("Total anomalies = ").append(s.getTotalAnomalies()).append("\n");
            ctx.append("En attente (PENDING) = ").append(s.getPendingAnomalies()).append("\n");
            ctx.append("Corrigees (CORRECTED) = ").append(s.getCorrectedAnomalies()).append("\n");
            ctx.append("Validees (VALIDATED) = ").append(s.getValidatedAnomalies()).append("\n");
            ctx.append("Taux de correction = ").append(String.format("%.1f", s.getCorrectionRate())).append("%\n");
            if (s.getAnomaliesByType() != null) {
                s.getAnomaliesByType().forEach((type, count) ->
                    ctx.append("Anomalies ").append(type).append(" = ").append(count).append("\n")
                );
            }
            ctx.append("\n");

            // --- TICKETS ---
            ctx.append("[TICKETS]\n");
            ctx.append("Tickets ouverts = ").append(d.getPendingTickets()).append("\n");
            ctx.append("Tickets resolus = ").append(d.getResolvedTickets()).append("\n");
            ctx.append("Tickets moins de 24h = ").append(d.getTicketsUnder24h()).append("\n");
            ctx.append("Tickets 24-48h = ").append(d.getTickets24to48h()).append("\n");
            ctx.append("Tickets plus de 48h = ").append(d.getTicketsOver48h()).append("\n");
            ctx.append("\n");

            // --- ANOMALIES PAR AGENCE ---
            List<BranchAnomalyDto> branches = statsService.getAnomaliesByBranch();
            if (branches != null && !branches.isEmpty()) {
                ctx.append("[ANOMALIES PAR AGENCE]\n");
                branches.stream().limit(15).forEach(b ->
                    ctx.append(b.getLib_agence()).append(" (").append(b.getCode_agence()).append(") = ")
                       .append(b.getNombre_anomalies()).append(" anomalies\n")
                );
                ctx.append("\n");
            }

            // --- QUALITE PAR CATEGORIE ---
            List<ValidationMetricDto> metrics = statsService.getValidationMetrics();
            if (metrics != null && !metrics.isEmpty()) {
                ctx.append("[QUALITE PAR CATEGORIE]\n");
                metrics.forEach(m ->
                    ctx.append(m.getCategory())
                       .append(": ").append(m.getTotal_records()).append(" fiches totales, ")
                       .append(m.getValid_records()).append(" fiches valides, ")
                       .append("score = ").append(String.format("%.1f", m.getQuality_score())).append("%\n")
                );
            }

            // --- REGLES DE VALIDATION ---
            List<ValidationRule> rules = validationRuleRepository.findByActive(true);
            if (rules != null && !rules.isEmpty()) {
                ctx.append("[REGLES DE VALIDATION]\n");
                ctx.append("Nombre total de regles actives = ").append(rules.size()).append("\n");
                rules.forEach(r -> {
                    ctx.append("- ").append(r.getRuleName());
                    if (r.getFieldLabel() != null) {
                        ctx.append(" (champ: ").append(r.getFieldLabel()).append(")");
                    } else {
                        ctx.append(" (champ: ").append(r.getFieldName()).append(")");
                    }
                    if (r.getClientType() != null) {
                        ctx.append(" [").append(r.getClientType()).append("]");
                    }
                    ctx.append(": ").append(r.getDescription() != null ? r.getDescription() : r.getErrorMessage());
                    if (r.getSeverity() != null) {
                        ctx.append(" (severite: ").append(r.getSeverity()).append(")");
                    }
                    ctx.append("\n");
                });
            }

        } catch (Exception e) {
            log.error("Erreur lors de la construction du contexte Faro: {}", e.getMessage(), e);
            ctx.append("[ERREUR] Donnees en temps reel indisponibles: ").append(e.getMessage()).append("\n");
        }
        return ctx.toString();
    }
}
