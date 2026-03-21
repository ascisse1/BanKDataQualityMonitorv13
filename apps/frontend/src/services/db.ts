import { logger } from './logger';
import { tracer } from './tracer';

// API base URL - using Vite proxy to forward to Spring Boot backend
// Using relative URL so requests go through Vite's proxy which handles CORS and auth
const API_BASE_URL = '/api';

// Spring Boot API response wrapper
interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

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

// Spring Data Page format
interface SpringDataPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Helper to convert Spring Data Page to PaginatedResponse
function toPagedResponse<T>(data: SpringDataPage<T> | PaginatedResponse<T> | any): PaginatedResponse<T> {
  // If it's already in PaginatedResponse format
  if (data && 'data' in data && Array.isArray(data.data)) {
    return data as PaginatedResponse<T>;
  }

  // If it's Spring Data Page format
  if (data && 'content' in data && Array.isArray(data.content)) {
    return {
      data: data.content,
      page: (data.number || 0) + 1, // Spring uses 0-based index
      limit: data.size || 10,
      total: data.totalElements || 0
    };
  }

  // If it's just an array
  if (Array.isArray(data)) {
    return {
      data: data,
      page: 1,
      limit: data.length,
      total: data.length
    };
  }

  // Default empty response
  return {
    data: [],
    page: 1,
    limit: 10,
    total: 0
  };
}

// Map backend ClientType enum to frontend tcli code
function mapClientTypeToCode(clientType: string | undefined): string {
  switch (clientType) {
    case 'INDIVIDUAL': return '1';
    case 'CORPORATE': return '2';
    case 'INSTITUTIONAL': return '3';
    default: return '1';
  }
}

// Map backend AnomalyStatus enum to French labels
function mapStatusToFrench(status: string | undefined): string {
  switch (status) {
    case 'PENDING': return 'Nouveau';
    case 'IN_PROGRESS': return 'En cours';
    case 'CORRECTED': return 'Corrigé';
    case 'VALIDATED': return 'Résolu';
    case 'REJECTED': return 'Rejeté';
    case 'CLOSED': return 'Fermé';
    default: return status || 'Nouveau';
  }
}

// Map severity to French labels
function mapSeverityToFrench(severity: string | undefined): string {
  switch (severity?.toUpperCase()) {
    case 'HIGH': return 'Haute';
    case 'MEDIUM': return 'Moyenne';
    case 'LOW': return 'Faible';
    case 'HAUTE': return 'Haute';
    case 'MOYENNE': return 'Moyenne';
    case 'FAIBLE': return 'Faible';
    default: return severity || 'Moyenne';
  }
}

// Map backend AnomalyDto to frontend expected format
function mapAnomalyToFrontend(anomaly: any): any {
  // Extract first name from clientName if it contains space (e.g., "TRAORE Mamadou")
  const clientNameParts = (anomaly.clientName || '').split(' ');
  const lastName = clientNameParts[0] || '';
  const firstName = clientNameParts.slice(1).join(' ') || '';

  return {
    // Map backend fields to frontend expected format
    cli: anomaly.clientNumber || anomaly.cli || '',
    nom: lastName || anomaly.nom || '',
    tcli: mapClientTypeToCode(anomaly.clientType) || anomaly.tcli || '1',
    pre: firstName || anomaly.pre || '',
    prenom: firstName || anomaly.prenom || '', // Also add prenom for compatibility
    age: anomaly.agencyCode || anomaly.age || '',

    // Anomaly-specific fields
    field: anomaly.fieldLabel || anomaly.field || '',
    fieldCode: anomaly.fieldName || anomaly.fieldCode || '',
    errorType: anomaly.errorType || 'Valeur manquante',
    errorMessage: anomaly.errorMessage || '',
    severity: mapSeverityToFrench(anomaly.severity),
    status: mapStatusToFrench(anomaly.status),

    // Additional fields from backend
    currentValue: anomaly.currentValue || '',
    expectedValue: anomaly.expectedValue || '',
    correctionValue: anomaly.correctionValue || '',

    // Keep original fields for potential use
    id: anomaly.id,
    agencyName: anomaly.agencyName || '',
    createdAt: anomaly.createdAt,
    updatedAt: anomaly.updatedAt,

    // Client data fields that might be empty (not from anomaly DTO)
    nid: anomaly.nid || '',
    nmer: anomaly.nmer || '',
    dna: anomaly.dna || '',
    nat: anomaly.nat || '',
    sext: anomaly.sext || '',
    viln: anomaly.viln || '',
    payn: anomaly.payn || '',
    tid: anomaly.tid || '',
    nrc: anomaly.nrc || '',
    datc: anomaly.datc || '',
    rso: anomaly.rso || ''
  };
}

interface BranchAnomaly {
  code_agence: string;
  lib_agence: string;
  nombre_anomalies: number;
}

interface TrackingData {
  agencyCode: string;
  agencyName: string;
  flux: {
    total: number;
    anomalies: number;
    fiabilises: number;
  };
  stock: {
    actifs: number;
    anomalies: number;
    fiabilises: number;
  };
  general: {
    actifs: number;
    anomalies: number;
    fiabilises: number;
  };
  indicators: {
    tauxAnomalies: number;
    tauxFiabilisation: number;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DatabaseService {
  private static instance: DatabaseService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private requestQueue: Map<string, number> = new Map();
  private retryCount: Map<string, number> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private activeRequests: Set<string> = new Set();

  // Constants
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 2;
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 50;
  private readonly REQUEST_TIMEOUT = 8000; // 8 seconds timeout for regular requests
  private readonly EXPORT_TIMEOUT = 15000; // 15 seconds timeout for exports
  private readonly PREFETCH_TIMEOUT = 5000; // 5 seconds timeout for prefetch requests

  private constructor() {
    // Initialize service
    this.cleanCache();
    tracer.info('database', 'Database service initialized (Backend API mode)');

    // Set up periodic cache cleaning
    setInterval(() => this.cleanCache(), 60 * 1000); // Clean every minute
    setInterval(() => this.cleanRequestQueue(), 30 * 1000); // Clean request queue every 30 seconds

    // Clean up aborted controllers
    window.addEventListener('beforeunload', () => {
      this.abortAllRequests();
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private cleanCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      tracer.debug('database', `Cleaned ${cleaned} cache entries`);
    }
  }

  private cleanRequestQueue(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.requestQueue.entries()) {
      if (now - timestamp > 30000) { // 30 seconds
        this.requestQueue.delete(key);
      }
    }
  }

  private abortAllRequests(): void {
    tracer.info('database', `Aborting ${this.abortControllers.size} active requests`);
    for (const [key, controller] of this.abortControllers.entries()) {
      try {
        controller.abort();
        tracer.debug('database', `Aborted request: ${key}`);
      } catch (error) {
        // Ignore errors when aborting
      }
    }
    this.abortControllers.clear();
    this.activeRequests.clear();
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const sortedParams = params ?
      Object.keys(params).sort().reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>) : {};
    return `${endpoint}${JSON.stringify(sortedParams)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      tracer.debug('database', `Cache hit for key: ${key}`);
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setToCache(key: string, data: any): void {
    // Limit cache size for memory management
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
    tracer.debug('database', `Cache set for key: ${key}`);
  }

  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>,
    isPrefetch: boolean = false
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache<T>(cacheKey);

    if (cached) {
      tracer.info('database', `Cache hit for ${endpoint}`, { params });
      return Promise.resolve(cached);
    }

    // Build URL with query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = isPrefetch ? this.PREFETCH_TIMEOUT : this.REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      tracer.info('database', `Fetching from API: ${url}`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      // Unwrap Spring Boot ApiResponse format if needed
      let data: T;
      if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
        // Spring Boot ApiResponse format
        const apiResponse = responseData as ApiResponseWrapper<T>;
        if (!apiResponse.success) {
          throw new Error(apiResponse.message || 'API request failed');
        }
        data = apiResponse.data;
      } else {
        // Direct response format
        data = responseData as T;
      }

      // Cache the successful response
      this.setToCache(cacheKey, data);
      tracer.info('database', `Successfully fetched data from ${endpoint}`);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        tracer.warning('database', `Request timeout for ${endpoint}`, { timeout });
        logger.warning('database', `Request timeout for ${endpoint}`, { timeout });
      } else {
        tracer.error('database', `API request failed for ${endpoint}`, { error });
        logger.error('database', `API request failed for ${endpoint}`, { error });
      }

      throw error;
    }
  }

  public async getValidationMetrics(): Promise<ValidationMetric[]> {
    try {
      tracer.info('database', 'Getting validation metrics');
      // Spring Boot endpoint: /api/stats/validation-metrics
      const result = await this.fetchApi<Record<string, any>>('/stats/validation-metrics');

      // Transform the response to ValidationMetric[] format
      if (Array.isArray(result)) {
        return result;
      }

      // If it's an object, convert to array format
      return Object.entries(result).map(([category, data]: [string, any]) => ({
        category,
        total_records: data?.totalRecords || data?.total_records || 0,
        valid_records: data?.validRecords || data?.valid_records || 0,
        quality_score: data?.qualityScore || data?.quality_score || 0
      }));
    } catch (error) {
      tracer.error('database', 'Failed to get validation metrics', { error });
      logger.error('api', 'Failed to get validation metrics', { error });
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      tracer.info('database', 'Testing database connection');

      // Try the stats endpoint to verify connection
      const stats = await this.fetchApi<ClientStats>('/stats/clients', {}, {}, false);
      tracer.info('database', 'Database connection test successful', stats);
      return {
        success: true,
        message: `Connected to backend (${(stats?.total ?? 0).toLocaleString()} total clients)`
      };
    } catch (error) {
      tracer.error('database', 'Database connection test failed', { error });
      return {
        success: false,
        message: `Failed to connect to API: ${(error as Error).message}`
      };
    }
  }

  public async getClientStats(): Promise<ClientStats> {
    try {
      tracer.info('database', 'Getting client statistics');
      const stats = await this.fetchApi<ClientStats>('/stats/clients');
      return {
        total: stats?.total ?? 0,
        individual: stats?.individual ?? 0,
        corporate: stats?.corporate ?? 0,
        institutional: stats?.institutional ?? 0,
        anomalies: stats?.anomalies ?? 0,
        fatca: stats?.fatca ?? 0
      };
    } catch (error) {
      tracer.error('database', 'Failed to get client statistics', { error });
      logger.error('api', 'Failed to get client statistics', { error });
      // Return default stats on error
      return {
        total: 0,
        individual: 0,
        corporate: 0,
        institutional: 0,
        anomalies: 0,
        fatca: 0
      };
    }
  }

  public async getFatcaStats(clientType: string = 'all'): Promise<FatcaStats> {
    try {
      tracer.info('database', 'Getting FATCA statistics', { clientType });

      const data = await this.fetchApi<FatcaStats>('/fatca/stats', {}, { clientType });
      tracer.info('database', 'FATCA statistics retrieved successfully', data);
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
      return {
        total: 0,
        individual: 0,
        corporate: 0,
        toVerify: 0,
        confirmed: 0,
        excluded: 0,
        pending: 0,
        currentMonth: 0
      };
    }
  }

  public async getFatcaIndicators(): Promise<FatcaIndicators> {
    try {
      tracer.info('database', 'Getting FATCA indicators');

      const data = await this.fetchApi<FatcaIndicators>('/fatca/indicators');
      tracer.info('database', 'FATCA indicators retrieved successfully', data);
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
      return {
        nationality: 0,
        birthplace: 0,
        address: 0,
        phone: 0,
        proxy: 0
      };
    }
  }

  public async getFatcaClients(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, status: string | null = null, clientType: string = '1'): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting FATCA clients', { page, limit, forExport, status, clientType });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      // Spring Boot uses 0-based page indexing
      const params: Record<string, any> = {
        page: Math.max(0, page - 1),
        size: queryLimit
      };

      if (status) {
        params.status = status;
      }

      const result = await this.fetchApi<any>('/fatca/clients', {}, params);
      const paginatedResult = toPagedResponse<any>(result);
      tracer.info('database', 'FATCA clients retrieved successfully', {
        count: paginatedResult.data?.length || 0,
        total: paginatedResult.total || 0
      });
      return paginatedResult;
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA clients', { error, page, limit, status, clientType });
      logger.error('api', 'Failed to get FATCA clients', { error });
      return { data: [], page, limit, total: 0 };
    }
  }

  public async getCorporateFatcaClients(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, status: string | null = null): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate FATCA clients', { page, limit, forExport, status });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      // Spring Boot uses 0-based page indexing
      const params: Record<string, any> = {
        page: Math.max(0, page - 1),
        size: queryLimit
      };

      if (status) {
        params.status = status;
      }

      const result = await this.fetchApi<any>('/fatca/corporate', {}, params);
      const paginatedResult = toPagedResponse<any>(result);
      tracer.info('database', 'Corporate FATCA clients retrieved successfully', {
        count: paginatedResult.data?.length || 0,
        total: paginatedResult.total || 0
      });
      return paginatedResult;
    } catch (error) {
      tracer.error('database', 'Failed to get corporate FATCA clients', { error, page, limit, status });
      logger.error('api', 'Failed to get corporate FATCA clients', { error });
      return { data: [], page, limit, total: 0 };
    }
  }

  public async getIndividualAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting individual anomalies', { page, limit, forExport, ...params });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      // Spring Boot uses 0-based page indexing
      const queryParams = {
        page: Math.max(0, page - 1),
        size: queryLimit,
        ...params
      };

      const result = await this.fetchApi<any>('/anomalies/individual', {}, queryParams);
      const paginatedResult = toPagedResponse<any>(result);

      // Map backend format to frontend expected format
      paginatedResult.data = paginatedResult.data.map(mapAnomalyToFrontend);

      tracer.info('database', 'Individual anomalies retrieved successfully', {
        count: paginatedResult.data?.length || 0,
        total: paginatedResult.total || 0
      });
      return paginatedResult;
    } catch (error) {
      tracer.error('database', 'Failed to get individual anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get individual anomalies', { error });
      return { data: [], page, limit, total: 0 };
    }
  }

  public async getCorporateAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate anomalies', { page, limit, forExport, ...params });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      // Spring Boot uses 0-based page indexing
      const queryParams = {
        page: Math.max(0, page - 1),
        size: queryLimit,
        ...params
      };

      const result = await this.fetchApi<any>('/anomalies/corporate', {}, queryParams);
      const paginatedResult = toPagedResponse<any>(result);

      // Map backend format to frontend expected format
      paginatedResult.data = paginatedResult.data.map(mapAnomalyToFrontend);

      tracer.info('database', 'Corporate anomalies retrieved successfully', {
        count: paginatedResult.data?.length || 0,
        total: paginatedResult.total || 0
      });
      return paginatedResult;
    } catch (error) {
      tracer.error('database', 'Failed to get corporate anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get corporate anomalies', { error });
      return { data: [], page, limit, total: 0 };
    }
  }

  public async getInstitutionalAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting institutional anomalies', { page, limit, forExport, ...params });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      // Spring Boot uses 0-based page indexing
      const queryParams = {
        page: Math.max(0, page - 1),
        size: queryLimit,
        ...params
      };

      const result = await this.fetchApi<any>('/anomalies/institutional', {}, queryParams);
      const paginatedResult = toPagedResponse<any>(result);

      // Map backend format to frontend expected format
      paginatedResult.data = paginatedResult.data.map(mapAnomalyToFrontend);

      tracer.info('database', 'Institutional anomalies retrieved successfully', {
        count: paginatedResult.data?.length || 0,
        total: paginatedResult.total || 0
      });
      return paginatedResult;
    } catch (error) {
      tracer.error('database', 'Failed to get institutional anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get institutional anomalies', { error });
      return { data: [], page, limit, total: 0 };
    }
  }

  public async getAnomaliesByBranch(): Promise<BranchAnomaly[]> {
    try {
      tracer.info('database', 'Getting anomalies by branch');

      const data = await this.fetchApi<BranchAnomaly[]>('/anomalies/by-branch');
      tracer.info('database', 'Anomalies by branch retrieved successfully', { count: data?.length || 0 });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      tracer.error('database', 'Failed to get anomalies by branch', { error });
      logger.error('api', 'Failed to get anomalies by branch', { error });
      return [];
    }
  }

  public async getGlobalTrackingData(startDate?: string, endDate?: string, clientTypes?: string[], agencyCode?: string): Promise<TrackingData[]> {
    try {
      tracer.info('database', 'Getting global tracking data', { startDate, endDate, clientTypes, agencyCode });

      const params: Record<string, any> = {};

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      if (clientTypes && clientTypes.length > 0 && clientTypes.length < 3) {
        params.clientTypes = clientTypes.join(',');
      }

      if (agencyCode) {
        params.agencyCode = agencyCode;
      }

      const result = await this.fetchApi<any>('/tracking/global', {}, params);
      tracer.info('database', 'Global tracking data retrieved successfully', { count: result?.length || 0 });

      // The Spring Boot /tracking/global endpoint returns a map, not an array
      // Convert it to the expected format
      if (Array.isArray(result)) {
        return result;
      }

      // If it's an object with tracking data, return it as a single-item array
      if (result && typeof result === 'object') {
        return [{
          agencyCode: 'ALL',
          agencyName: 'Global',
          flux: {
            total: result.totalRecordsProcessed || 0,
            anomalies: result.totalAnomaliesDetected || 0,
            fiabilises: 0
          },
          stock: {
            actifs: result.totalTickets || 0,
            anomalies: result.totalAnomalies || 0,
            fiabilises: 0
          },
          general: {
            actifs: result.totalFatcaClients || 0,
            anomalies: result.totalAnomalies || 0,
            fiabilises: 0
          },
          indicators: {
            tauxAnomalies: 0,
            tauxFiabilisation: 0
          }
        }];
      }

      return [];
    } catch (error) {
      tracer.error('database', 'Failed to get global tracking data', { error, startDate, endDate, clientTypes, agencyCode });
      logger.error('api', 'Failed to get global tracking data', { error });
      return [];
    }
  }

  public async executeQuery(query: string) {
    try {
      tracer.info('database', 'Executing custom query', { queryLength: query.length });

      const result = await this.fetchApi('/query/execute', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
      tracer.info('database', 'Query executed successfully', { resultSize: JSON.stringify(result).length });
      return result;
    } catch (error) {
      tracer.error('database', 'Query execution failed', { error, queryLength: query.length });
      logger.error('api', 'Query execution failed', { error });
      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      tracer.info('database', 'Clearing cache');

      // Clear API cache
      try {
        await this.fetchApi('/cache/clear', { method: 'POST' });
      } catch (apiError) {
        tracer.warning('database', 'Failed to clear API cache', { error: apiError });
      }

      this.cache.clear();
      this.loadingPromises.clear();
      this.retryCount.clear();
      tracer.info('database', 'Cache cleared successfully');
      logger.info('system', 'Cache cleared successfully');
    } catch (error) {
      tracer.error('database', 'Failed to clear cache', { error });
      logger.error('api', 'Failed to clear cache', { error });
    }
  }

  public async prefetchCommonData(): Promise<void> {
    try {
      tracer.info('database', 'Starting data prefetch');

      // Prefetch in parallel with error handling and shorter timeouts
      const prefetchPromises = [
        this.fetchApi<ClientStats>('/stats/clients', {}, {}, true)
          .catch(e => {
            tracer.error('database', 'Prefetch client stats failed', { error: e });
            return null;
          }),
        this.fetchApi<BranchAnomaly[]>('/anomalies/by-branch', {}, {}, true)
          .catch(e => {
            tracer.error('database', 'Prefetch branch anomalies failed', { error: e });
            return null;
          }),
        this.fetchApi<Record<string, any>>('/stats/validation-metrics', {}, {}, true)
          .catch(e => {
            tracer.error('database', 'Prefetch validation metrics failed', { error: e });
            return null;
          }),
        this.fetchApi<PaginatedResponse<any>>('/anomalies/individual', {}, { page: 1, limit: 10 }, true)
          .catch(e => {
            tracer.error('database', 'Prefetch individual anomalies failed', { error: e });
            return null;
          }),
        this.fetchApi<PaginatedResponse<any>>('/anomalies/corporate', {}, { page: 1, limit: 10 }, true)
          .catch(e => {
            tracer.error('database', 'Prefetch corporate anomalies failed', { error: e });
            return null;
          }),
        this.fetchApi<FatcaStats>('/fatca/stats', {}, { clientType: 'all' }, true)
          .catch(e => {
            tracer.error('database', 'Prefetch FATCA stats failed', { error: e });
            return null;
          }),
        this.fetchApi<PaginatedResponse<any>>('/fatca/clients', {}, { page: 1, limit: 10, clientType: '1' }, true)
          .catch(e => {
            tracer.error('database', 'Prefetch FATCA clients failed', { error: e });
            return null;
          }),
        this.fetchApi<PaginatedResponse<any>>('/fatca/corporate', {}, { page: 1, limit: 10 }, true)
          .catch(e => {
            tracer.error('database', 'Prefetch corporate FATCA clients failed', { error: e });
            return null;
          }),
        this.fetchApi<FatcaIndicators>('/fatca/indicators', {}, {}, true)
          .catch(e => {
            tracer.error('database', 'Prefetch FATCA indicators failed', { error: e });
            return null;
          })
      ];

      // Use Promise.allSettled to handle all promises regardless of success/failure
      const results = await Promise.allSettled(prefetchPromises);

      // Log prefetch results
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      const failureCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null)).length;

      tracer.info('database', 'Data prefetch completed', {
        total: results.length,
        success: successCount,
        failure: failureCount
      });

      logger.info('system', 'Data prefetch completed');
    } catch (error) {
      tracer.error('database', 'Failed to prefetch common data', { error });
      logger.error('api', 'Failed to prefetch common data', { error });
    }
  }

  public async getAgencies(): Promise<{ code_agence: string; lib_agence: string }[]> {
    try {
      tracer.info('database', 'Getting agencies');

      // Use /agencies/ordered endpoint for sorted agency list
      const data = await this.fetchApi<any[]>('/agencies/ordered');
      tracer.info('database', 'Agencies retrieved successfully', { count: data?.length || 0 });

      // Map backend AgencyDto format to frontend format
      if (Array.isArray(data)) {
        return data.map((agency: any) => ({
          code_agence: agency.code || agency.age || '',
          lib_agence: agency.name || agency.lib || ''
        }));
      }

      return [];
    } catch (error) {
      tracer.error('database', 'Failed to get agencies', { error });
      logger.error('api', 'Failed to get agencies', { error });
      return [];
    }
  }

  // Performance monitoring
  public getCacheStats() {
    const stats = {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.size,
      abortControllers: this.abortControllers.size,
      loadingPromises: this.loadingPromises.size
    };

    tracer.debug('database', 'Cache stats retrieved', stats);

    return stats;
  }
}

export const db = DatabaseService.getInstance();
