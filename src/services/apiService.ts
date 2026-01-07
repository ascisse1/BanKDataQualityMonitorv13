import { logger } from './logger';
import { tracer } from './tracer';

// API Base URL - should be configured in .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Authentication token - should be retrieved from auth context
let authToken: string | null = null;

// Set auth token
export const setAuthToken = (token: string) => {
  authToken = token;
};

// Clear auth token
export const clearAuthToken = () => {
  authToken = null;
};

// Generic API request function with error handling
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  customHeaders?: Record<string, string>
): Promise<T> => {
  try {
    tracer.info('network', `API ${method} request to ${endpoint}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    
    // Add auth token if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    tracer.info('network', `API ${method} request to ${endpoint} successful`);
    return result as T;
  } catch (error) {
    tracer.error('network', `API ${method} request to ${endpoint} failed`, { error });
    logger.error('api', `API request failed: ${endpoint}`, { error });
    throw error;
  }
};

// Customer API services
export const customerService = {
  // Get customer list with filtering options
  getCustomerList: async (filters?: {
    searchTerm?: string;
    agencyCode?: string;
    clientType?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (filters?.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
    if (filters?.agencyCode) queryParams.append('agencyCode', filters.agencyCode);
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const endpoint = `/getCustomerList?${queryParams.toString()}`;
    return apiRequest<any>(endpoint);
  },
  
  // Get customer detail
  getCustomerDetail: async (customerId: string) => {
    return apiRequest<any>(`/getCustomerDetail?cli=${customerId}`);
  },
  
  // Modify customer to fix anomalies
  modifyCustomer: async (customerId: string, data: any) => {
    return apiRequest<any>('/modifyCustomer', 'POST', {
      cli: customerId,
      ...data
    });
  }
};

// Anomaly detection and correction services
export const anomalyService = {
  // Get list of anomalies
  getAnomalies: async (filters?: {
    clientType?: string;
    agencyCode?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.agencyCode) queryParams.append('agencyCode', filters.agencyCode);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const endpoint = `/anomalies?${queryParams.toString()}`;
    return apiRequest<any>(endpoint);
  },
  
  // Get anomalies for a specific customer
  getCustomerAnomalies: async (customerId: string) => {
    return apiRequest<any>(`/anomalies/customer?cli=${customerId}`);
  },
  
  // Fix an anomaly
  fixAnomaly: async (anomalyData: {
    cli: string;
    field: string;
    oldValue: string | null;
    newValue: string;
    status: 'fixed' | 'in_review' | 'rejected';
  }) => {
    return apiRequest<any>('/anomaly-history', 'POST', anomalyData);
  }
};

// Account API services
export const accountService = {
  // Get account list for a customer
  getAccountList: async (customerId: string) => {
    return apiRequest<any>(`/getAccountList?cli=${customerId}`);
  },
  
  // Get account details
  getAccountDetail: async (accountId: string) => {
    return apiRequest<any>(`/getAccountDetail?account=${accountId}`);
  }
};

// Generic API service with CRUD operations for Spring Boot backend
export const apiService = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),

  post: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, 'POST', data),

  put: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, 'PUT', data),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),

  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, 'PUT', data),
};

export default {
  setAuthToken,
  clearAuthToken,
  apiRequest,
  apiService,
  customerService,
  anomalyService,
  accountService
};