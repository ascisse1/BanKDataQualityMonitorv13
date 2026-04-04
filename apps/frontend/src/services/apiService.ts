import apiClient from '../lib/apiClient';
import { log } from './log';

/**
 * Generic API request function built on the shared apiClient (Axios).
 *
 * BFF Security Model:
 * - Uses HttpOnly session cookies for authentication
 * - CSRF token is handled by apiClient interceptors
 * - 401/403 responses are handled by apiClient interceptors
 */
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: unknown,
  customHeaders?: Record<string, string>
): Promise<T> => {
  try {
    log.info('network', `API ${method} request to ${endpoint}`);

    const response = await apiClient.request<T>({
      url: `/api${endpoint}`,
      method,
      data: method !== 'GET' ? data : undefined,
      headers: customHeaders,
    });

    log.info('network', `API ${method} request to ${endpoint} successful`);
    return response.data;
  } catch (error) {
    log.error('network', `API ${method} request to ${endpoint} failed`, { error });
    throw error;
  }
};

// Customer API services
export const customerService = {
  getCustomerList: async (filters?: {
    searchTerm?: string;
    structureCode?: string;
    clientType?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
    if (filters?.structureCode) queryParams.append('structureCode', filters.structureCode);
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const endpoint = `/getCustomerList?${queryParams.toString()}`;
    return apiRequest<unknown>(endpoint);
  },

  getCustomerDetail: async (customerId: string) => {
    return apiRequest<unknown>(`/getCustomerDetail?cli=${customerId}`);
  },

  modifyCustomer: async (customerId: string, data: unknown) => {
    return apiRequest<unknown>('/modifyCustomer', 'POST', {
      cli: customerId,
      ...(data as object)
    });
  }
};

// Anomaly detection and correction services
export const anomalyService = {
  getAnomalies: async (filters?: {
    clientType?: string;
    structureCode?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.structureCode) queryParams.append('structureCode', filters.structureCode);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const endpoint = `/anomalies?${queryParams.toString()}`;
    return apiRequest<unknown>(endpoint);
  },

  getCustomerAnomalies: async (customerId: string) => {
    return apiRequest<unknown>(`/anomalies/customer?cli=${customerId}`);
  },

  fixAnomaly: async (anomalyData: {
    cli: string;
    field: string;
    oldValue: string | null;
    newValue: string;
    status: 'fixed' | 'in_review' | 'rejected';
  }) => {
    return apiRequest<unknown>('/anomaly-history', 'POST', anomalyData);
  }
};

// Account API services
export const accountService = {
  getAccountList: async (customerId: string) => {
    return apiRequest<unknown>(`/getAccountList?cli=${customerId}`);
  },

  getAccountDetail: async (accountId: string) => {
    return apiRequest<unknown>(`/getAccountDetail?account=${accountId}`);
  }
};

// Generic API service with CRUD operations
export const apiService = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, 'POST', data),
  put: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, 'PUT', data),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
  patch: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, 'PATCH', data),
};

export default {
  apiRequest,
  apiService,
  customerService,
  anomalyService,
  accountService
};
