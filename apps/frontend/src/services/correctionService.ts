import apiClient from '../lib/apiClient';
import { log } from './log';

// Types
export type CorrectionAction = 'FIX' | 'REVIEW' | 'REJECT';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RejectionReason =
  | 'FALSE_POSITIVE'
  | 'DUPLICATE'
  | 'OUT_OF_SCOPE'
  | 'INSUFFICIENT_INFO'
  | 'DATA_SOURCE_ERROR'
  | 'OTHER';

export interface CorrectionRequest {
  cli: string;
  fieldName: string;
  fieldLabel?: string;
  oldValue: string | null;
  newValue: string | null;
  structureCode: string;
  notes?: string;
  action: CorrectionAction;
  priority?: TicketPriority;
  rejectionReason?: RejectionReason;
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
      log.info('api', 'Submitting correction', { cli: request.cli, field: request.fieldName });

      const response = await apiClient.post<ApiResponse<CorrectionResponse>>(
        '/api/corrections',
        request
      );

      if (response.data.success) {
        log.info('api', 'Correction submitted successfully', {
          ticketNumber: response.data.data.ticketNumber,
        });
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to submit correction');
    } catch (error) {
      log.error('api', 'Failed to submit correction', { error });
      throw error;
    }
  },

  /**
   * Get corrections for a specific client
   */
  async getClientCorrections(cli: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `/api/corrections/client/${cli}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      log.error('api', 'Failed to get client corrections', { error, cli });
      throw error;
    }
  },

  /**
   * Get tickets pending validation (for supervisors)
   */
  async getPendingValidation(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        '/api/corrections/pending-validation'
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      log.error('api', 'Failed to get pending validations', { error });
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
      log.info('api', `${approved ? 'Approving' : 'Rejecting'} correction`, { ticketId });

      const response = await apiClient.post<ApiResponse<CorrectionResponse>>(
        `/api/corrections/${ticketId}/validate`,
        { approved, reason }
      );

      if (response.data.success) {
        log.info('api', 'Validation completed', {
          ticketId,
          status: response.data.data.ticketStatus,
        });
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to validate correction');
    } catch (error) {
      log.error('api', 'Failed to validate correction', { error, ticketId });
      throw error;
    }
  },

  /**
   * Request validation for a ticket (move to PENDING_VALIDATION)
   */
  async requestValidation(ticketId: number, notes?: string): Promise<CorrectionResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CorrectionResponse>>(
        `/api/corrections/${ticketId}/request-validation`,
        { notes }
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to request validation');
    } catch (error) {
      log.error('api', 'Failed to request validation', { error, ticketId });
      throw error;
    }
  },
};

export default correctionService;
