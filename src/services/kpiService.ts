import { apiService } from './apiService';

export interface Kpi {
  id: number;
  periodDate: string;
  agencyCode?: string;
  kpiType: 'CLOSURE_RATE' | 'SLA_COMPLIANCE' | 'AVG_RESOLUTION_TIME';
  kpiValue: number;
  targetValue?: number;
  ticketsTotal: number;
  ticketsClosed: number;
  ticketsSlaRespected: number;
  ticketsSlaBreached: number;
  avgResolutionTimeHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  closureRate: number;
  slaCompliance: number;
  avgResolutionTime: number;
  ticketsTotal: number;
  ticketsClosed: number;
  ticketsSlaBreached: number;
}

class KpiService {
  private baseUrl = '/api/kpis';

  async getKpisByDate(date: string): Promise<Kpi[]> {
    const response = await apiService.get<{ data: Kpi[] }>(
      `${this.baseUrl}/date/${date}`
    );
    return response.data;
  }

  async getKpisByAgency(agencyCode: string): Promise<Kpi[]> {
    const response = await apiService.get<{ data: Kpi[] }>(
      `${this.baseUrl}/agency/${agencyCode}`
    );
    return response.data;
  }

  async getKpisByAgencyAndDateRange(
    agencyCode: string,
    startDate: string,
    endDate: string
  ): Promise<Kpi[]> {
    const response = await apiService.get<{ data: Kpi[] }>(
      `${this.baseUrl}/agency/${agencyCode}/range?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async getKpisByTypeAndDateRange(
    kpiType: string,
    startDate: string,
    endDate: string
  ): Promise<Kpi[]> {
    const response = await apiService.get<{ data: Kpi[] }>(
      `${this.baseUrl}/type/${kpiType}/range?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async getAverageKpiValue(
    kpiType: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const response = await apiService.get<{ data: number }>(
      `${this.baseUrl}/type/${kpiType}/average?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async getDashboardMetrics(
    agencyCode?: string,
    date?: string
  ): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (agencyCode) params.append('agencyCode', agencyCode);
    if (date) params.append('date', date);

    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl}/dashboard?${queryString}`
      : `${this.baseUrl}/dashboard`;

    const response = await apiService.get<{ data: DashboardMetrics }>(url);
    return response.data;
  }

  async calculateKpis(date: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/calculate?date=${date}`);
  }

  getKpiLabel(kpiType: Kpi['kpiType']): string {
    switch (kpiType) {
      case 'CLOSURE_RATE':
        return 'Taux de Clôture';
      case 'SLA_COMPLIANCE':
        return 'Respect SLA';
      case 'AVG_RESOLUTION_TIME':
        return 'Temps Moyen Résolution';
      default:
        return kpiType;
    }
  }

  getKpiUnit(kpiType: Kpi['kpiType']): string {
    switch (kpiType) {
      case 'CLOSURE_RATE':
      case 'SLA_COMPLIANCE':
        return '%';
      case 'AVG_RESOLUTION_TIME':
        return 'h';
      default:
        return '';
    }
  }

  getKpiColor(value: number, target: number, kpiType: Kpi['kpiType']): string {
    if (kpiType === 'AVG_RESOLUTION_TIME') {
      return value <= target ? 'text-green-600' : 'text-red-600';
    }
    return value >= target ? 'text-green-600' : 'text-red-600';
  }
}

export const kpiService = new KpiService();
