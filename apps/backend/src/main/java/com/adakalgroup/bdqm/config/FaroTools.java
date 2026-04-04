package com.adakalgroup.bdqm.config;

import com.adakalgroup.bdqm.dto.BranchAnomalyDto;
import com.adakalgroup.bdqm.dto.DashboardStatsDto;
import com.adakalgroup.bdqm.dto.StatsDto;
import com.adakalgroup.bdqm.dto.ValidationMetricDto;
import com.adakalgroup.bdqm.service.AnomalyService;
import com.adakalgroup.bdqm.service.StatsService;
import com.adakalgroup.bdqm.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Faro AI Tools — Methods the LLM can call to query live data.
 * Spring AI automatically exposes @Tool methods to the model.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.faro.enabled", havingValue = "true")
public class FaroTools {

    private final StatsService statsService;
    private final StatisticsService statisticsService;
    private final AnomalyService anomalyService;

    @Tool(description = "Statistiques clients: total, particuliers, entreprises, institutionnels, score qualite global, tickets ouverts/resolus")
    public DashboardStatsDto getClientStats() {
        return statsService.getClientStats();
    }

    @Tool(description = "Anomalies globales: total, par statut (pending/corrected/validated), taux de correction, repartition par type client")
    public StatsDto getGlobalStats() {
        return statisticsService.getGlobalStats();
    }

    @Tool(description = "Nombre d'anomalies par agence/branche avec code et libelle agence")
    public List<BranchAnomalyDto> getAnomaliesByBranch() {
        return statsService.getAnomaliesByBranch();
    }

    @Tool(description = "Score qualite par categorie: particuliers, entreprises, institutionnels avec nombre de fiches totales et valides")
    public List<ValidationMetricDto> getValidationMetrics() {
        return statsService.getValidationMetrics();
    }

    @Tool(description = "Nombre d'anomalies par statut: PENDING, IN_PROGRESS, CORRECTED, VALIDATED, REJECTED, CLOSED")
    public Map<String, Long> getAnomalyCountsByStatus() {
        return anomalyService.getAnomalyCountsByStatus();
    }
}
