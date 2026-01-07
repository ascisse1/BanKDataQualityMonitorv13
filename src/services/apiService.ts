import { logger } from './logger';
import { tracer } from './tracer';

// API Base URL - should be configured in .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

<<<<<<< HEAD
/**
 * Extracts CSRF token from cookie (set by Spring Security).
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Generic API request function with session-based authentication.
 *
 * BFF Security Model:
 * - Uses HttpOnly session cookies for authentication
 * - Includes CSRF token for state-changing requests
 * - No Bearer tokens exposed to JavaScript (XSS-safe)
 */
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: unknown,
=======
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
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  customHeaders?: Record<string, string>
): Promise<T> => {
  try {
    tracer.info('network', `API ${method} request to ${endpoint}`);
<<<<<<< HEAD

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    // Add CSRF token for state-changing requests
    if (method !== 'GET') {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include session cookies
      body: data ? JSON.stringify(data) : undefined
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      logger.warning('security', 'Session expired, redirecting to login');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    // Handle 403 Forbidden - insufficient permissions
    if (response.status === 403) {
      logger.warning('security', 'Access denied', { endpoint });
      throw new Error('Access denied: insufficient permissions');
    }

=======
    
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
    
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
<<<<<<< HEAD

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

=======
    
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
<<<<<<< HEAD

=======
    
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
    if (filters?.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
    if (filters?.agencyCode) queryParams.append('agencyCode', filters.agencyCode);
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
<<<<<<< HEAD

    const endpoint = `/getCustomerList?${queryParams.toString()}`;
    return apiRequest<unknown>(endpoint);
  },

  // Get customer detail
  getCustomerDetail: async (customerId: string) => {
    return apiRequest<unknown>(`/getCustomerDetail?cli=${customerId}`);
  },

  // Modify customer to fix anomalies
  modifyCustomer: async (customerId: string, data: unknown) => {
    return apiRequest<unknown>('/modifyCustomer', 'POST', {
      cli: customerId,
      ...(data as object)
=======
    
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
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
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
<<<<<<< HEAD

=======
    
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
    if (filters?.clientType) queryParams.append('clientType', filters.clientType);
    if (filters?.agencyCode) queryParams.append('agencyCode', filters.agencyCode);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
<<<<<<< HEAD

    const endpoint = `/anomalies?${queryParams.toString()}`;
    return apiRequest<unknown>(endpoint);
  },

  // Get anomalies for a specific customer
  getCustomerAnomalies: async (customerId: string) => {
    return apiRequest<unknown>(`/anomalies/customer?cli=${customerId}`);
  },

=======
    
    const endpoint = `/anomalies?${queryParams.toString()}`;
    return apiRequest<any>(endpoint);
  },
  
  // Get anomalies for a specific customer
  getCustomerAnomalies: async (customerId: string) => {
    return apiRequest<any>(`/anomalies/customer?cli=${customerId}`);
  },
  
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  // Fix an anomaly
  fixAnomaly: async (anomalyData: {
    cli: string;
    field: string;
    oldValue: string | null;
    newValue: string;
    status: 'fixed' | 'in_review' | 'rejected';
  }) => {
<<<<<<< HEAD
    return apiRequest<unknown>('/anomaly-history', 'POST', anomalyData);
=======
    return apiRequest<any>('/anomaly-history', 'POST', anomalyData);
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  }
};

// Account API services
export const accountService = {
  // Get account list for a customer
  getAccountList: async (customerId: string) => {
<<<<<<< HEAD
    return apiRequest<unknown>(`/getAccountList?cli=${customerId}`);
  },

  // Get account details
  getAccountDetail: async (accountId: string) => {
    return apiRequest<unknown>(`/getAccountDetail?account=${accountId}`);
=======
    return apiRequest<any>(`/getAccountList?cli=${customerId}`);
  },
  
  // Get account details
  getAccountDetail: async (accountId: string) => {
    return apiRequest<any>(`/getAccountDetail?account=${accountId}`);
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  }
};

// Generic API service with CRUD operations for Spring Boot backend
export const apiService = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),

<<<<<<< HEAD
  post: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, 'POST', data),

  put: <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, 'PUT', data),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),

  patch: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, 'PATCH', data),
};

export default {
=======
  post: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, 'POST', data),

  put: <T>(endpoint: string, data?: any) => apiRequest<T>(endpoint, 'PUT', data),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),

  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, 'PUT', data),
};

export default {
  setAuthToken,
  clearAuthToken,
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  apiRequest,
  apiService,
  customerService,
  anomalyService,
  accountService
<<<<<<< HEAD
};
=======
};
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
