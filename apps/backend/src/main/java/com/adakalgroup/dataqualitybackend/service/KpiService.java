package com.adakalgroup.dataqualitybackend.service;

import com.adakalgroup.dataqualitybackend.model.Kpi;
import com.adakalgroup.dataqualitybackend.model.Ticket;
import com.adakalgroup.dataqualitybackend.model.enums.TicketStatus;
import com.adakalgroup.dataqualitybackend.repository.KpiRepository;
import com.adakalgroup.dataqualitybackend.repository.TicketRepository;
import com.adakalgroup.dataqualitybackend.security.StructureSecurityService;
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
    private final StructureSecurityService structureSecurityService;

    @Transactional
    public void calculateDailyKpis(LocalDate date) {
        log.info("Calculating KPIs for date: {}", date);

        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
        // Use a trailing 30-day window to capture tickets active during the period
        LocalDateTime startOfWindow = date.minusDays(29).atStartOfDay();

        List<Ticket> tickets = ticketRepository.findTicketsActiveInPeriod(startOfWindow, endOfDay);

        Map<String, List<Ticket>> ticketsByAgency = tickets.stream()
            .collect(Collectors.groupingBy(Ticket::getStructureCode));

        for (Map.Entry<String, List<Ticket>> entry : ticketsByAgency.entrySet()) {
            String structureCode = entry.getKey();
            List<Ticket> agencyTickets = entry.getValue();

            calculateAgencyKpis(date, structureCode, agencyTickets);
        }

        calculateGlobalKpis(date, tickets);

        log.info("KPIs calculated for {} agencies over 30-day trailing window", ticketsByAgency.size());
    }

    private void calculateAgencyKpis(LocalDate date, String structureCode, List<Ticket> tickets) {
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

        saveOrUpdateKpi(date, structureCode, "CLOSURE_RATE", closureRate, 95.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);

        saveOrUpdateKpi(date, structureCode, "SLA_COMPLIANCE", slaComplianceRate, 90.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);

        saveOrUpdateKpi(date, structureCode, "AVG_RESOLUTION_TIME", avgResolutionTime, 48.0,
            totalTickets, closedTickets, slaRespectedTickets, slaBreachedTickets, avgResolutionTime);
    }

    private void calculateGlobalKpis(LocalDate date, List<Ticket> tickets) {
        calculateAgencyKpis(date, "GLOBAL", tickets);
    }

    private void saveOrUpdateKpi(LocalDate date, String structureCode, String kpiType, Double value, Double target,
                                 int total, int closed, int slaRespected, int slaBreached, Double avgResTime) {
        Kpi kpi = kpiRepository.findByPeriodDateAndStructureCodeAndKpiType(date, structureCode, kpiType)
            .orElse(Kpi.builder()
                .periodDate(date)
                .structureCode(structureCode)
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

    public List<Kpi> getKpisByAgency(String structureCode) {
        structureSecurityService.requireAgencyAccess(structureCode);
        return kpiRepository.findByStructureCode(structureCode);
    }

    public List<Kpi> getKpisByDateRange(String structureCode, LocalDate startDate, LocalDate endDate) {
        structureSecurityService.requireAgencyAccess(structureCode);
        return kpiRepository.findByAgencyAndDateRange(structureCode, startDate, endDate);
    }

    public List<Kpi> getKpisByTypeAndDateRange(String kpiType, LocalDate startDate, LocalDate endDate) {
        return kpiRepository.findByTypeAndDateRange(kpiType, startDate, endDate);
    }

    public Double getAverageKpiValue(String kpiType, LocalDate startDate, LocalDate endDate) {
        return kpiRepository.getAverageKpiValue(kpiType, startDate, endDate);
    }

    public Map<String, Object> getDashboardMetrics(String structureCode, LocalDate date) {
        if (structureCode != null) {
            structureSecurityService.requireAgencyAccess(structureCode);
        }
        List<Kpi> kpis = structureCode != null ?
            kpiRepository.findByAgencyAndDateRange(structureCode, date, date) :
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
