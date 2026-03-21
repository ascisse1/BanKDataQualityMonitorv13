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
    tracer.info('network', `Banking API ${method} request to ${endpoint}`);
    
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
    tracer.info('network', `Banking API ${method} request to ${endpoint} successful`);
    return result as T;
  } catch (error) {
    tracer.error('network', `Banking API ${method} request to ${endpoint} failed`, { error });
    logger.error('api', `Banking API request failed: ${endpoint}`, { error });
    throw error;
  }
};

// Customer API services based on the provided banking API
export const customerService = {
  // Get customer details using getCustomerDetail service
  getCustomerDetail: async (customerId: string) => {
    return apiRequest<any>(`/getCustomerDetail?cli=${customerId}`);
  },
  
  // Get customer list using getCustomerList service
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
    
    return apiRequest<any>(`/getCustomerList?${queryParams.toString()}`);
  },
  
  // Modify customer to fix anomalies using modifyCustomer service
  modifyCustomer: async (customerId: string, data: any) => {
    return apiRequest<any>('/modifyCustomer', 'POST', {
      cli: customerId,
      ...data
    });
  },
  
  // Get customer address list using getCustomerAddressList service
  getCustomerAddressList: async (customerId: string) => {
    return apiRequest<any>(`/getCustomerAddressList?cli=${customerId}`);
  },
  
  // Get customer phone number list using getCustomerPhoneNumberList service
  getCustomerPhoneNumberList: async (customerId: string) => {
    return apiRequest<any>(`/getCustomerPhoneNumberList?cli=${customerId}`);
  },
  
  // Get customer email address list using getCustomerEmailAddressList service
  getCustomerEmailAddressList: async (customerId: string) => {
    return apiRequest<any>(`/getCustomerEmailAddressList?cli=${customerId}`);
  },
  
  // Modify customer address using modifyCustomerAddress service
  modifyCustomerAddress: async (customerId: string, addressData: any) => {
    return apiRequest<any>('/modifyCustomerAddress', 'POST', {
      cli: customerId,
      ...addressData
    });
  },
  
  // Modify customer phone number using modifyCustomerPhoneNumber service
  modifyCustomerPhoneNumber: async (customerId: string, phoneData: any) => {
    return apiRequest<any>('/modifyCustomerPhoneNumber', 'POST', {
      cli: customerId,
      ...phoneData
    });
  },
  
  // Modify customer email address using modifyCustomerEmailAddress service
  modifyCustomerEmailAddress: async (customerId: string, emailData: any) => {
    return apiRequest<any>('/modifyCustomerEmailAddress', 'POST', {
      cli: customerId,
      ...emailData
    });
  }
};

// Anomaly detection and correction services
export const anomalyService = {
  // Record anomaly correction history
  recordAnomalyCorrection: async (anomalyData: {
    cli: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    status: 'fixed' | 'in_review' | 'rejected';
    agencyCode?: string;
  }) => {
    return apiRequest<any>('/api/anomaly-history', 'POST', anomalyData);
  },
  
  // Get anomaly history for a client
  getAnomalyHistory: async (customerId: string, field?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('cli', customerId);
    if (field) queryParams.append('field', field);
    
    return apiRequest<any>(`/api/anomaly-history?${queryParams.toString()}`);
  }
};

// Account API services
export const accountService = {
  // Get account list for a customer using getAccountList service
  getAccountList: async (customerId: string) => {
    return apiRequest<any>(`/getAccountList?cli=${customerId}`);
  },
  
  // Get account details using getAccountDetail service
  getAccountDetail: async (accountId: string) => {
    return apiRequest<any>(`/getAccountDetail?account=${accountId}`);
  }
};

export default {
  setAuthToken,
  clearAuthToken,
  apiRequest,
  customerService,
  anomalyService,
  accountService
};