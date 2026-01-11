import axios from 'axios';
import { logger } from './logger';

const SPRING_BOOT_URL = import.meta.env.VITE_SPRING_BOOT_URL || 'http://localhost:8080';

// Create axios instance for corrections API
const correctionApi = axios.create({
  baseURL: SPRING_BOOT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Add CSRF token to requests
correctionApi.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// Types
export type CorrectionAction = 'FIX' | 'REVIEW' | 'REJECT';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface CorrectionRequest {
  cli: string;
  fieldName: string;
  fieldLabel?: string;
  oldValue: string | null;
  newValue: string | null;
  agencyCode: string;
  notes?: string;
  action: CorrectionAction;
  priority?: TicketPriority;
}

export interface CorrectionResponse {
  correctionId: number;
  ticketId: number;
  ticketNumber: string;
  cli: string;
  fieldName: string;
  fieldLabel?: string;
  oldValue?: string;
  newValue?: string;
  ticketStatus: string;
  incidentStatus: string;
  processInstanceId?: string;
  createdAt: string;
  message: string;
  requiresValidation: boolean;
  assignedToUser?: string;
  slaDeadline?: string;
}

export interface ValidationRequest {
  approved: boolean;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Correction Service - Handles anomaly corrections with 4 Eyes validation workflow
 */
export const correctionService = {
  /**
   * Submit a correction for an anomaly
   * Creates a ticket and starts the 4 Eyes validation workflow
   */
  async submitCorrection(request: CorrectionRequest): Promise<CorrectionResponse> {
    try {
      logger.info('api', 'Submitting correction', { cli: request.cli, field: request.fieldName });

      const response = await correctionApi.post<ApiResponse<CorrectionResponse>>(
        '/api/corrections',
        request
      );

      if (response.data.success) {
        logger.info('api', 'Correction submitted successfully', {
          ticketNumber: response.data.data.ticketNumber,
        });
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to submit correction');
    } catch (error) {
      logger.error('api', 'Failed to submit correction', { error });
      throw error;
    }
  },

  /**
   * Get corrections for a specific client
   */
  async getClientCorrections(cli: string): Promise<any[]> {
    try {
      const response = await correctionApi.get<ApiResponse<any[]>>(
        `/api/corrections/client/${cli}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      logger.error('api', 'Failed to get client corrections', { error, cli });
      throw error;
    }
  },

  /**
   * Get tickets pending validation (for supervisors)
   */
  async getPendingValidation(): Promise<any[]> {
    try {
      const response = await correctionApi.get<ApiResponse<any[]>>(
        '/api/corrections/pending-validation'
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      logger.error('api', 'Failed to get pending validations', { error });
      throw error;
    }
  },

  /**
   * Validate a correction (4 Eyes approval/rejection)
   */
  async validateCorrection(
    ticketId: number,
    approved: boolean,
    reason?: string
  ): Promise<CorrectionResponse> {
    try {
      logger.info('api', `${approved ? 'Approving' : 'Rejecting'} correction`, { ticketId });

      const response = await correctionApi.post<ApiResponse<CorrectionResponse>>(
        `/api/corrections/${ticketId}/validate`,
        { approved, reason }
      );

      if (response.data.success) {
        logger.info('api', 'Validation completed', {
          ticketId,
          status: response.data.data.ticketStatus,
        });
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to validate correction');
    } catch (error) {
      logger.error('api', 'Failed to validate correction', { error, ticketId });
      throw error;
    }
  },

  /**
   * Request validation for a ticket (move to PENDING_VALIDATION)
   */
  async requestValidation(ticketId: number, notes?: string): Promise<CorrectionResponse> {
    try {
      const response = await correctionApi.post<ApiResponse<CorrectionResponse>>(
        `/api/corrections/${ticketId}/request-validation`,
        { notes }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to request validation');
    } catch (error) {
      logger.error('api', 'Failed to request validation', { error, ticketId });
      throw error;
    }
  },
};

export default correctionService;
