import { logger } from './logger';
import { tracer } from './tracer';
import { apiRequest } from './apiService';

// Types
interface ValidationMetric {
  category: string;
  total_records: number;
  valid_records: number;
  quality_score: number;
}

interface ClientStats {
  total: number;
  individual: number;
  corporate: number;
  institutional: number;
  anomalies: number;
  fatca: number;
}

interface FatcaStats {
  total: number;
  individual: number;
  corporate: number;
  toVerify: number;
  confirmed: number;
  excluded: number;
  pending: number;
  currentMonth: number;
}

interface FatcaIndicators {
  nationality: number;
  birthplace: number;
  address: number;
  phone: number;
  proxy: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

interface BranchAnomaly {
  code_agence: string;
  lib_agence: string;
  nombre_anomalies: number;
}

/**
 * Data Service - Handles all data operations via backend API
 * This service replaces the old Supabase service with direct backend calls
 */
class DataService {
  private static instance: DataService;

  private constructor() {
    tracer.info('database', 'Data service initialized');
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      tracer.info('database', 'Testing backend connection');
      const result = await apiRequest<{ message: string; totalRecords?: number }>('/health');
      return {
        success: true,
        message: result.message || 'Backend connection successful'
      };
    } catch (error) {
      tracer.error('database', 'Backend connection test failed', { error });
      return {
        success: false,
        message: 'Backend connection failed',
      };
    }
  }

  public async getClientStats(): Promise<ClientStats> {
    try {
      tracer.info('database', 'Getting client statistics from backend');
      const data = await apiRequest<ClientStats>('/stats/clients');
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get client statistics', { error });
      logger.error('api', 'Failed to get client statistics', { error });
      throw error;
    }
  }

  public async getValidationMetrics(): Promise<ValidationMetric[]> {
    try {
      tracer.info('database', 'Getting validation metrics from backend');
      const data = await apiRequest<ValidationMetric[]>('/validation-metrics');
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get validation metrics', { error });
      logger.error('api', 'Failed to get validation metrics', { error });
      throw error;
    }
  }

  public async getIndividualAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting individual anomalies from backend', { page, limit, forExport, ...params });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', (forExport ? 5000 : limit).toString());
      if (forExport) queryParams.append('forExport', 'true');
      if (params.agencyCode) queryParams.append('agencyCode', params.agencyCode);

      const endpoint = `/anomalies/individual?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get individual anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get individual anomalies', { error });
      throw error;
    }
  }

  public async getCorporateAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate anomalies from backend', { page, limit, forExport, ...params });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', (forExport ? 5000 : limit).toString());
      if (forExport) queryParams.append('forExport', 'true');
      if (params.agencyCode) queryParams.append('agencyCode', params.agencyCode);

      const endpoint = `/anomalies/corporate?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get corporate anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get corporate anomalies', { error });
      throw error;
    }
  }

  public async getInstitutionalAnomalies(page = 1, limit = 10, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting institutional anomalies from backend', { page, limit, forExport, ...params });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', (forExport ? 5000 : limit).toString());
      if (forExport) queryParams.append('forExport', 'true');
      if (params.agencyCode) queryParams.append('agencyCode', params.agencyCode);

      const endpoint = `/anomalies/institutional?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get institutional anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get institutional anomalies', { error });
      throw error;
    }
  }

  public async getAnomaliesByBranch(): Promise<BranchAnomaly[]> {
    try {
      tracer.info('database', 'Getting anomalies by branch from backend');
      const data = await apiRequest<BranchAnomaly[]>('/anomalies/by-branch');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get anomalies by branch', { error });
      logger.error('api', 'Failed to get anomalies by branch', { error });
      throw error;
    }
  }

  public async getFatcaStats(clientType: string = 'all'): Promise<FatcaStats> {
    try {
      tracer.info('database', 'Getting FATCA statistics from backend', { clientType });
      const data = await apiRequest<FatcaStats>(`/fatca/stats?clientType=${clientType}`);
      return {
        total: data?.total || 0,
        individual: data?.individual || 0,
        corporate: data?.corporate || 0,
        toVerify: data?.toVerify || 0,
        confirmed: data?.confirmed || 0,
        excluded: data?.excluded || 0,
        pending: data?.pending || 0,
        currentMonth: data?.currentMonth || 0
      };
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA statistics', { error, clientType });
      logger.error('api', 'Failed to get FATCA statistics', { error });
      throw error;
    }
  }

  public async getFatcaIndicators(): Promise<FatcaIndicators> {
    try {
      tracer.info('database', 'Getting FATCA indicators from backend');
      const data = await apiRequest<FatcaIndicators>('/fatca/indicators');
      return {
        nationality: data?.nationality || 0,
        birthplace: data?.birthplace || 0,
        address: data?.address || 0,
        phone: data?.phone || 0,
        proxy: data?.proxy || 0
      };
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA indicators', { error });
      logger.error('api', 'Failed to get FATCA indicators', { error });
      throw error;
    }
  }

  public async getFatcaClients(page = 1, limit = 10, forExport = false, status: string | null = null, clientType: string = '1'): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting FATCA clients from backend', { page, limit, forExport, status, clientType });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', (forExport ? 5000 : limit).toString());
      queryParams.append('clientType', clientType);
      if (forExport) queryParams.append('forExport', 'true');
      if (status) queryParams.append('status', status);

      const endpoint = `/fatca/clients?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA clients', { error, page, limit, status, clientType });
      logger.error('api', 'Failed to get FATCA clients', { error });
      throw error;
    }
  }

  public async getCorporateFatcaClients(page = 1, limit = 10, forExport = false, status: string | null = null): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate FATCA clients from backend', { page, limit, forExport, status });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', (forExport ? 5000 : limit).toString());
      if (forExport) queryParams.append('forExport', 'true');
      if (status) queryParams.append('status', status);

      const endpoint = `/fatca/corporate?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get corporate FATCA clients', { error, page, limit, status });
      logger.error('api', 'Failed to get corporate FATCA clients', { error });
      throw error;
    }
  }

  public async updateFatcaStatus(cli: string, status: string, notes: string | null, username: string): Promise<boolean> {
    try {
      tracer.info('database', 'Updating FATCA status via backend', { cli, status, username });

      await apiRequest('/fatca/status', 'PUT', {
        cli,
        status,
        notes,
        username
      });

      tracer.info('database', 'FATCA status updated successfully', { cli, status });
      return true;
    } catch (error) {
      tracer.error('database', 'Failed to update FATCA status', { error, cli, status });
      logger.error('api', 'Failed to update FATCA status', { error });
      return false;
    }
  }

  public async recordAnomaly(cli: string, field: string, oldValue: string | null, newValue: string | null, status: string, agencyCode: string | null, userId: number): Promise<boolean> {
    try {
      tracer.info('database', 'Recording anomaly via backend', { cli, field, status, agencyCode, userId });

      await apiRequest('/anomaly-history', 'POST', {
        cli,
        field,
        oldValue,
        newValue,
        status,
        agencyCode,
        userId
      });

      tracer.info('database', 'Anomaly recorded successfully', { cli, field, status });
      return true;
    } catch (error) {
      tracer.error('database', 'Failed to record anomaly', { error, cli, field, status });
      logger.error('api', 'Failed to record anomaly', { error });
      return false;
    }
  }

  public async getAnomalyHistory(cli?: string, field?: string, agencyCode?: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting anomaly history from backend', { cli, field, agencyCode, page, limit });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (cli) queryParams.append('cli', cli);
      if (field) queryParams.append('field', field);
      if (agencyCode) queryParams.append('agencyCode', agencyCode);

      const endpoint = `/anomaly-history?${queryParams.toString()}`;
      const data = await apiRequest<PaginatedResponse<any>>(endpoint);
      return data;
    } catch (error) {
      tracer.error('database', 'Failed to get anomaly history', { error, cli, field, agencyCode });
      logger.error('api', 'Failed to get anomaly history', { error });
      return {
        data: [],
        page,
        limit,
        total: 0
      };
    }
  }

  public async getAgencyCorrectionStats(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting agency correction stats from backend');
      const data = await apiRequest<any[]>('/stats/agency-corrections');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get agency correction stats', { error });
      logger.error('api', 'Failed to get agency correction stats', { error });
      throw error;
    }
  }

  public async getWeeklyCorrectionStats(weeks = 12): Promise<any[]> {
    try {
      tracer.info('database', 'Getting weekly correction stats from backend', { weeks });
      const data = await apiRequest<any[]>(`/stats/weekly-corrections?weeks=${weeks}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get weekly correction stats', { error, weeks });
      logger.error('api', 'Failed to get weekly correction stats', { error });
      throw error;
    }
  }

  public async getDataLoadHistory(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting data load history from backend');
      const data = await apiRequest<any[]>('/stats/data-load-history');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get data load history', { error });
      logger.error('api', 'Failed to get data load history', { error });
      throw error;
    }
  }

  public async getUsersByAgency(): Promise<any[]> {
    try {
      tracer.info('database', 'Getting users by agency from backend');
      const data = await apiRequest<any[]>('/stats/users-by-agency');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get users by agency', { error });
      logger.error('api', 'Failed to get users by agency', { error });
      throw error;
    }
  }

  public async getGlobalTrackingData(startDate: string, endDate: string, clientTypes: string[], agencyCode?: string): Promise<any[]> {
    try {
      tracer.info('database', 'Getting global tracking data from backend', { startDate, endDate, clientTypes, agencyCode });

      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (clientTypes && clientTypes.length > 0) queryParams.append('clientTypes', clientTypes.join(','));
      if (agencyCode) queryParams.append('agencyCode', agencyCode);

      const endpoint = `/tracking/global?${queryParams.toString()}`;
      const data = await apiRequest<any[]>(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get global tracking data', { error, startDate, endDate, clientTypes, agencyCode });
      logger.error('api', 'Failed to get global tracking data', { error });
      throw error;
    }
  }

  public async executeQuery(query: string): Promise<any[]> {
    try {
      tracer.info('database', 'Executing custom query via backend', { queryLength: query.length });

      const data = await apiRequest<any[]>('/query/execute', 'POST', { query });
      tracer.info('database', 'Query executed successfully', { resultSize: data?.length || 0 });
      return data || [];
    } catch (error) {
      tracer.error('database', 'Query execution failed', { error, queryLength: query.length });
      logger.error('api', 'Query execution failed', { error });
      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      tracer.info('database', 'Clearing cache via backend');
      await apiRequest('/cache/clear', 'POST');
      logger.info('system', 'Cache cleared successfully');
      tracer.info('database', 'Cache cleared successfully');
    } catch (error) {
      tracer.error('database', 'Failed to clear cache', { error });
      logger.error('api', 'Failed to clear cache', { error });
    }
  }
}

export const dataService = DataService.getInstance();
