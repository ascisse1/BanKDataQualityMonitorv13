import { logger } from './logger';
import { tracer } from './tracer';
import { supabaseService } from './supabaseService';
import { isDemoMode } from './databaseConfig';
import { demoDataProvider } from './demoData';

// API base URL
const API_BASE_URL = '/api';

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

// Custom error class for timeouts
class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
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
    tracer.info('database', `Database service initialized (${isDemoMode ? 'Demo Mode' : 'Production Mode'})`);

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

  private setCache(key: string, data: any): void {
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

  private async fetchWithDeduplication<T>(
      key: string,
      fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    let promise = this.loadingPromises.get(key);
    if (promise) {
      tracer.debug('database', `Request deduplication for key: ${key}`);
      return promise;
    }

    // Track request frequency
    const now = Date.now();
    this.requestQueue.set(key, now);
    this.activeRequests.add(key);

    promise = fetchFn().finally(() => {
      this.loadingPromises.delete(key);
      this.activeRequests.delete(key);
      // Also clean up any abort controller
      if (this.abortControllers.has(key)) {
        this.abortControllers.delete(key);
      }
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  private async fetchApi<T>(
      endpoint: string,
      options: RequestInit = {},
      params?: Record<string, any>,
      isPrefetch: boolean = false,
      useFallback: boolean = true
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache<T>(cacheKey);

    if (cached) {
      tracer.info('database', `Cache hit for ${endpoint}`, { params });
      return Promise.resolve(cached);
    }

    // En mode démo, retourner directement les données fictives
    if (isDemoMode) {
      tracer.info('database', `Using fallback data for ${endpoint} (demo mode)`, { params });
      return Promise.resolve(this.getFallbackData(endpoint, params));
    }

    // En mode production, appeler l'API backend
    const requestKey = `${endpoint}${JSON.stringify(params || {})}`;

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
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the successful response
      this.setToCache(cacheKey, data);
      tracer.info('database', `Successfully fetched data from ${endpoint}`);

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        tracer.warning('database', `Request timeout for ${endpoint}`, { timeout });
        logger.warn('database', `Request timeout for ${endpoint}`, { timeout });
      } else {
        tracer.error('database', `API request failed for ${endpoint}`, { error });
        logger.error('database', `API request failed for ${endpoint}`, { error });
      }

      // Use fallback data if enabled
      if (useFallback) {
        tracer.info('database', `Using fallback data for ${endpoint} due to error`);
        return this.getFallbackData(endpoint, params);
      }

      throw error;
    }
  }

  private getFallbackData<T>(endpoint: string, params?: Record<string, any>): T {
    tracer.info('database', `Using fallback data for ${endpoint}`, { params });

    // Return structured demo data based on endpoint
    if (endpoint.includes('/stats/clients')) {
      return demoDataProvider.getClientStats() as unknown as T;
    }

    if (endpoint.includes('/validation-metrics')) {
      return demoDataProvider.getValidationMetrics() as unknown as T;
    }

    if (endpoint.includes('/fatca/stats')) {
      return demoDataProvider.getFatcaStats() as unknown as T;
    }

    if (endpoint.includes('/fatca/indicators')) {
      return demoDataProvider.getFatcaIndicators() as unknown as T;
    }

    if (endpoint.includes('/anomalies/by-branch')) {
      return demoDataProvider.getAnomaliesByBranch() as unknown as T;
    }

    if (endpoint.includes('/tracking/global')) {
      return demoDataProvider.getGlobalTrackingData() as unknown as T;
    }

    if (endpoint.includes('/anomalies/individual')) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      return demoDataProvider.getIndividualAnomalies(page, limit) as unknown as T;
    }

    if (endpoint.includes('/anomalies/corporate')) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      return demoDataProvider.getCorporateAnomalies(page, limit) as unknown as T;
    }

    if (endpoint.includes('/anomalies/institutional')) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      return demoDataProvider.getInstitutionalAnomalies(page, limit) as unknown as T;
    }

    if (endpoint.includes('/fatca/clients')) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      return demoDataProvider.getFatcaClients(page, limit) as unknown as T;
    }

    if (endpoint.includes('/fatca/corporate')) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      return demoDataProvider.getCorporateFatcaClients(page, limit) as unknown as T;
    }

    // For other paginated endpoints, return empty paginated response
    if (endpoint.includes('/anomalies/') || endpoint.includes('/fatca/') || endpoint.includes('/clients')) {
      return {
        data: [],
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: 0
      } as unknown as T;
    }

    // Default fallback with safe structure
    return {
      data: [],
      total: 0,
      success: true,
      message: 'Fallback data'
    } as unknown as T;
  }

  public async getValidationMetrics(): Promise<ValidationMetric[]> {
    try {
      tracer.info('database', 'Getting validation metrics');

      return await this.fetchApi<ValidationMetric[]>('/validation-metrics', {}, {}, false, true);
    } catch (error) {
      tracer.error('database', 'Failed to get validation metrics', { error });
      logger.error('api', 'Failed to get validation metrics', { error });
      throw error;
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      tracer.info('database', 'Testing database connection');

      if (!isDemoMode) {
        // Try Supabase connection first
        try {
          const supabaseResult = await supabaseService.testConnection();
          if (supabaseResult.success) {
            tracer.info('database', 'Supabase connection test successful', supabaseResult);
            return supabaseResult;
          }
        } catch (supabaseError) {
          tracer.warning('database', 'Supabase connection test failed, falling back to API', { error: supabaseError });
        }
      }

      // Fall back to API connection
      try {
        const result = await this.fetchApi<{ message: string; totalRecords: number }>('/health', {}, {}, false, false);
        tracer.info('database', 'Database connection test successful', result);
        return {
          success: true,
          message: `${result.message} (${result.totalRecords?.toLocaleString()} records)`
        };
      } catch (apiError) {
        throw apiError;
      }
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

      return await this.fetchApi<ClientStats>('/stats/clients', {}, {}, false, true);
    } catch (error) {
      tracer.error('database', 'Failed to get client statistics', { error });
      throw error;
    }
  }

  public async getFatcaStats(clientType: string = 'all'): Promise<FatcaStats> {
    try {
      tracer.info('database', 'Getting FATCA statistics', { clientType });

      const data = await this.fetchApi<FatcaStats>('/fatca/stats', {}, { clientType }, false, true);
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
      throw error;
    }
  }

  public async getFatcaIndicators(): Promise<FatcaIndicators> {
    try {
      tracer.info('database', 'Getting FATCA indicators');

      const data = await this.fetchApi<FatcaIndicators>('/fatca/indicators', {}, {}, false, true);
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
      throw error;
    }
  }

  public async getFatcaClients(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, status: string | null = null, clientType: string = '1'): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting FATCA clients', { page, limit, forExport, status, clientType });

      const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
      const params: Record<string, any> = {
        page,
        limit: queryLimit,
        forExport,
        clientType
      };

      if (status) {
        params.status = status;
      }

      const result = await this.fetchApi<PaginatedResponse<any>>('/fatca/clients', {}, params, false, true);
      tracer.info('database', 'FATCA clients retrieved successfully', {
        count: result.data?.length || 0,
        total: result.total || 0
      });
      return result;
    } catch (error) {
      tracer.error('database', 'Failed to get FATCA clients', { error, page, limit, status, clientType });
      logger.error('api', 'Failed to get FATCA clients', { error });
      throw error;
    }
  }

  public async getCorporateFatcaClients(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, status: string | null = null): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate FATCA clients', { page, limit, forExport, status });

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getCorporateFatcaClients(page, limit, forExport, status);
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get corporate FATCA clients from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
        const params: Record<string, any> = {
          page,
          limit: queryLimit,
          forExport
        };

        if (status) {
          params.status = status;
        }

        const result = await this.fetchApi<PaginatedResponse<any>>('/fatca/corporate', {}, params);
        tracer.info('database', 'Corporate FATCA clients retrieved successfully', {
          count: result.data?.length || 0,
          total: result.total || 0
        });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Failed to get corporate FATCA clients', { error, page, limit, status });
      logger.error('api', 'Failed to get corporate FATCA clients', { error });
      throw error;
    }
  }

  public async getIndividualAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting individual anomalies', { page, limit, forExport, ...params });

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getIndividualAnomalies(page, limit, forExport, params);
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get individual anomalies from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
        const queryParams = {
          page,
          limit: queryLimit,
          forExport,
          ...params
        };

        const result = await this.fetchApi<PaginatedResponse<any>>('/anomalies/individual', {}, queryParams);
        tracer.info('database', 'Individual anomalies retrieved successfully', {
          count: result.data?.length || 0,
          total: result.total || 0
        });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Failed to get individual anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get individual anomalies', { error });
      throw error;
    }
  }

  public async getCorporateAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting corporate anomalies', { page, limit, forExport, ...params });

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getCorporateAnomalies(page, limit, forExport, params);
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get corporate anomalies from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
        const queryParams = {
          page,
          limit: queryLimit,
          forExport,
          ...params
        };

        const result = await this.fetchApi<PaginatedResponse<any>>('/anomalies/corporate', {}, queryParams);
        tracer.info('database', 'Corporate anomalies retrieved successfully', {
          count: result.data?.length || 0,
          total: result.total || 0
        });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Failed to get corporate anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get corporate anomalies', { error });
      throw error;
    }
  }

  public async getInstitutionalAnomalies(page = 1, limit = this.DEFAULT_LIMIT, forExport = false, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> {
    try {
      tracer.info('database', 'Getting institutional anomalies', { page, limit, forExport, ...params });

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getInstitutionalAnomalies(page, limit, forExport, params);
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get institutional anomalies from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const queryLimit = forExport ? 5000 : Math.min(limit, this.MAX_LIMIT);
        const queryParams = {
          page,
          limit: queryLimit,
          forExport,
          ...params
        };

        const result = await this.fetchApi<PaginatedResponse<any>>('/anomalies/institutional', {}, queryParams);
        tracer.info('database', 'Institutional anomalies retrieved successfully', {
          count: result.data?.length || 0,
          total: result.total || 0
        });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Failed to get institutional anomalies', { error, page, limit, ...params });
      logger.error('api', 'Failed to get institutional anomalies', { error });
      throw error;
    }
  }

  public async getAnomaliesByBranch(): Promise<BranchAnomaly[]> {
    try {
      tracer.info('database', 'Getting anomalies by branch');

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getAnomaliesByBranch();
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get anomalies by branch from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const data = await this.fetchApi<BranchAnomaly[]>('/anomalies/by-branch');
        tracer.info('database', 'Anomalies by branch retrieved successfully', { count: data?.length || 0 });
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      tracer.error('database', 'Failed to get anomalies by branch', { error });
      logger.error('api', 'Failed to get anomalies by branch', { error });
      throw error;
    }
  }

  public async getGlobalTrackingData(startDate?: string, endDate?: string, clientTypes?: string[], agencyCode?: string): Promise<TrackingData[]> {
    try {
      tracer.info('database', 'Getting global tracking data', { startDate, endDate, clientTypes, agencyCode });

      // Check if we're running on Netlify (no backend)
      const isNetlify = window.location.hostname.includes('netlify.app');
      if (isNetlify || isDemoMode) {
        tracer.info('database', 'Using demo data for global tracking data (Netlify or demo mode)');
        return demoDataProvider.getGlobalTrackingData();
      }

      const params: Record<string, any> = {};

      if (startDate) {
        params.startDate = startDate;
      }

      // Try to get data from Supabase first
      try {
        const supabaseData = await supabaseService.getGlobalTrackingData(startDate || '', endDate || '', clientTypes || [], agencyCode);
        return supabaseData;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to get global tracking data from Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const params: Record<string, any> = {
          startDate,
          endDate
        };

        if (clientTypes && clientTypes.length > 0 && clientTypes.length < 3) {
          params.clientTypes = clientTypes.join(',');
        }

        if (agencyCode) {
          params.agencyCode = agencyCode;
        }

        const result = await this.fetchApi<TrackingData[]>('/tracking/global', {}, params);
        tracer.info('database', 'Global tracking data retrieved successfully', { count: result?.length || 0 });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Failed to get global tracking data', { error, startDate, endDate, clientTypes, agencyCode });
      logger.error('api', 'Failed to get global tracking data', { error });
      throw error;
    }
  }

  public async executeQuery(query: string) {
    try {
      tracer.info('database', 'Executing custom query', { queryLength: query.length });

      // Try to execute query in Supabase first
      try {
        const supabaseResult = await supabaseService.executeQuery(query);
        return supabaseResult;
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to execute query in Supabase, falling back to API', { error: supabaseError });

        // Fall back to API
        const result = await this.fetchApi('/query/execute', {
          method: 'POST',
          body: JSON.stringify({ query })
        }, {}, false, false);
        tracer.info('database', 'Query executed successfully', { resultSize: JSON.stringify(result).length });
        return result;
      }
    } catch (error) {
      tracer.error('database', 'Query execution failed', { error, queryLength: query.length });
      logger.error('api', 'Query execution failed', { error });
      throw error;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      tracer.info('database', 'Clearing cache');

      // Clear Supabase cache
      try {
        await supabaseService.clearCache();
      } catch (supabaseError) {
        tracer.warning('database', 'Failed to clear Supabase cache', { error: supabaseError });
      }

      // Clear API cache
      try {
        await this.fetchApi('/cache/clear', { method: 'POST' }, {}, false, false);
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
              logger.error('api', 'Prefetch client stats failed', { error: e });
              return null;
            }),
        this.fetchApi<BranchAnomaly[]>('/anomalies/by-branch', {}, {}, true)
            .catch(e => {
              tracer.error('database', 'Prefetch branch anomalies failed', { error: e });
              logger.error('api', 'Prefetch branch anomalies failed', { error: e });
              return null;
            }),
        this.fetchApi<ValidationMetric[]>('/validation-metrics', {}, {}, true)
            .catch(e => {
              tracer.error('database', 'Prefetch validation metrics failed', { error: e });
              logger.error('api', 'Prefetch validation metrics failed', { error: e });
              return null;
            }),
        this.fetchApi<PaginatedResponse<any>>('/anomalies/individual', {}, { page: 1, limit: 10 }, true)
            .catch(e => {
              tracer.error('database', 'Prefetch individual anomalies failed', { error: e });
              logger.error('api', 'Prefetch individual anomalies failed', { error: e });
              return null;
            }),
        this.fetchApi<PaginatedResponse<any>>('/anomalies/corporate', {}, { page: 1, limit: 10 }, true)
            .catch(e => {
              tracer.error('database', 'Prefetch corporate anomalies failed', { error: e });
              logger.error('api', 'Prefetch corporate anomalies failed', { error: e });
              return null;
            }),
        this.fetchApi<FatcaStats>('/fatca/stats', {}, { clientType: 'all' }, true)
            .catch(e => {
              tracer.error('database', 'Prefetch FATCA stats failed', { error: e });
              logger.error('api', 'Prefetch FATCA stats failed', { error: e });
              return null;
            }),
        this.fetchApi<PaginatedResponse<any>>('/fatca/clients', {}, { page: 1, limit: 10, clientType: '1' }, true)
            .catch(e => {
              tracer.error('database', 'Prefetch FATCA clients failed', { error: e });
              logger.error('api', 'Prefetch FATCA clients failed', { error: e });
              return null;
            }),
        this.fetchApi<PaginatedResponse<any>>('/fatca/corporate', {}, { page: 1, limit: 10 }, true)
            .catch(e => {
              tracer.error('database', 'Prefetch corporate FATCA clients failed', { error: e });
              logger.error('api', 'Prefetch corporate FATCA clients failed', { error: e });
              return null;
            }),
        this.fetchApi<FatcaIndicators>('/fatca/indicators', {}, {}, true)
            .catch(e => {
              tracer.error('database', 'Prefetch FATCA indicators failed', { error: e });
              logger.error('api', 'Prefetch FATCA indicators failed', { error: e });
              return null;
            })
      ];

      // Use Promise.allSettled to handle all promises regardless of success/failure
      const results = await Promise.allSettled(prefetchPromises);

      // Log prefetch results
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      const failureCount = results.filter(r => r.status === 'rejected' || r.value === null).length;

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