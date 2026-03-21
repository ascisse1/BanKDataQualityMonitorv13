package com.bsic.dataqualitybackend.service;

import com.bsic.dataqualitybackend.model.Kpi;
import com.bsic.dataqualitybackend.model.Ticket;
import com.bsic.dataqualitybackend.model.enums.TicketStatus;
import com.bsic.dataqualitybackend.repository.KpiRepository;
import com.bsic.dataqualitybackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KpiService {

    private final KpiRepository kpiRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public void calculateDailyKpis(LocalDate date) {
        log.info("Calculating KPIs for date: {}", date);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Ticket> tickets = ticketRepository.findTicketsCreatedBetween(startOfDay, endOfDay);

        Map<String, List<Ticket>> ticketsByAgency = tickets.stream()
            .collect(Collectors.groupingBy(Ticket::getAgencyCode));

        for (Map.Entry<String, List<Ticket>> entry : ticketsByAgency.entrySet()) {
            String agencyCode = entry.getKey();
            List<Ticket> agencyTickets = entry.getValue();

            calculateAgencyKpis(date, agencyCode, agencyTickets);
        }

        calculateGlobalKpis(date, tickets);

        log.info("KPIs calculated for {} agencies", ticketsByAgency.size());
    }

    private void calculateAgencyKpis(LocalDate date, String agencyCode, List<Ticket> tickets) {
        int totalTickets = tickets.size();
        int closedTickets = (int) tickets.stream()
            .filter(t -> t.getStatus() == TicketStatus.CLOSED)
            .count();

        int slaRespectedTickets = (int) tickets.stream()
            .filter(t -> t.getStatus() == TicketStatus.CLOSED && !t.getSlaBreached())
            .count();

        int slaBreachedTickets = (int) tickets.stream()
            .filter(Ticket::getSlaBreached)
            .count();

        double avgResolutionTime = tickets.stream()
            .filter(t -> t.getStatus() == TicketStatus.CLOSED && t.getClosedAt() != null)
            .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getClosedAt()).toHours())
            .average()
            .orElse(0.0);

        double closureRate = totalTickets > 0 ? (closedTickets * 100.0 / totalTickets) : 0.0;
        double slaComplianceRate = closedTickets > 0 ? (slaRespectedTickets * 100.0 / closedTickets) : 0.0;

        saveOrUpdateKpi(date, agencyCode, "CLOSURE_RATE", closureRate, 95.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);

        saveOrUpdateKpi(date, agencyCode, "SLA_COMPLIANCE", slaComplianceRate, 90.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);

        saveOrUpdateKpi(date, agencyCode, "AVG_RESOLUTION_TIME", avgResolutionTime, 48.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);
    }

    private void calculateGlobalKpis(LocalDate date, List<Ticket> tickets) {
        calculateAgencyKpis(date, "GLOBAL", tickets);
    }

    private void saveOrUpdateKpi(LocalDate date, String agencyCode, String kpiType, Double value, Double target,
                                 int total, int closed, int slaRespected, int slaBreached, Double avgResTime) {
        Kpi kpi = kpiRepository.findByPeriodDateAndAgencyCodeAndKpiType(date, agencyCode, kpiType)
            .orElse(Kpi.builder()
                .periodDate(date)
                .agencyCode(agencyCode)
                .kpiType(kpiType)
                .build());

        kpi.setKpiValue(value);
        kpi.setTargetValue(target);
        kpi.setTicketsTotal(total);
        kpi.setTicketsClosed(closed);
        kpi.setTicketsSlaRespected(slaRespected);
        kpi.setTicketsSlaBreached(slaBreached);
        kpi.setAvgResolutionTimeHours(avgResTime);

        kpiRepository.save(kpi);
    }

    public List<Kpi> getKpisByDate(LocalDate date) {
        return kpiRepository.findByPeriodDate(date);
    }

    public List<Kpi> getKpisByAgency(String agencyCode) {
        return kpiRepository.findByAgencyCode(agencyCode);
    }

    public List<Kpi> getKpisByDateRange(String agencyCode, LocalDate startDate, LocalDate endDate) {
        return kpiRepository.findByAgencyAndDateRange(agencyCode, startDate, endDate);
    }

    public List<Kpi> getKpisByTypeAndDateRange(String kpiType, LocalDate startDate, LocalDate endDate) {
        return kpiRepository.findByTypeAndDateRange(kpiType, startDate, endDate);
    }

    public Double getAverageKpiValue(String kpiType, LocalDate startDate, LocalDate endDate) {
        return kpiRepository.getAverageKpiValue(kpiType, startDate, endDate);
    }

    public Map<String, Object> getDashboardMetrics(String agencyCode, LocalDate date) {
        List<Kpi> kpis = agencyCode != null ?
            kpiRepository.findByAgencyAndDateRange(agencyCode, date, date) :
            kpiRepository.findByPeriodDate(date);

        Kpi closureRate = kpis.stream()
            .filter(k -> "CLOSURE_RATE".equals(k.getKpiType()))
            .findFirst()
            .orElse(null);

        Kpi slaCompliance = kpis.stream()
            .filter(k -> "SLA_COMPLIANCE".equals(k.getKpiType()))
            .findFirst()
            .orElse(null);

        Kpi avgResolutionTime = kpis.stream()
            .filter(k -> "AVG_RESOLUTION_TIME".equals(k.getKpiType()))
            .findFirst()
            .orElse(null);

        return Map.of(
            "closureRate", closureRate != null ? closureRate.getKpiValue() : 0.0,
            "slaCompliance", slaCompliance != null ? slaCompliance.getKpiValue() : 0.0,
            "avgResolutionTime", avgResolutionTime != null ? avgResolutionTime.getKpiValue() : 0.0,
            "ticketsTotal", closureRate != null ? closureRate.getTicketsTotal() : 0,
            "ticketsClosed", closureRate != null ? closureRate.getTicketsClosed() : 0,
            "ticketsSlaBreached", closureRate != null ? closureRate.getTicketsSlaBreached() : 0
        );
    }
}
