import apiClient from '../lib/apiClient';
import { logger } from './logger';
import type { TicketDto } from './ticketService';

export interface TicketIncidentDto {
  id: number;
  incidentType: string;
  category: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  status: string;
  resolved: boolean;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class ValidationService {
  /**
   * Get tickets pending 4-eyes validation from the corrections API
   */
  async getPendingValidations(): Promise<TicketDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<TicketDto[]>>(
        '/api/corrections/pending-validation'
      );
      return response.data.data || [];
    } catch (error) {
      logger.error('api', 'Error fetching pending validations', { error });
      throw error;
    }
  }

  /**
   * Get ticket details by ID
   */
  async getTicketById(id: number): Promise<TicketDto | null> {
    try {
      const response = await apiClient.get<ApiResponse<TicketDto>>(
        `/api/tickets/${id}`
      );
      return response.data.data;
    } catch (error) {
      logger.error('api', 'Error fetching ticket', { error, id });
      return null;
    }
  }

  /**
   * Get incidents for a ticket
   */
  async getTicketIncidents(ticketId: number): Promise<TicketIncidentDto[]> {
    try {
      const response = await apiClient.get<ApiResponse<TicketIncidentDto[]>>(
        `/api/tickets/${ticketId}/incidents`
      );
      return response.data.data || [];
    } catch (error) {
      logger.error('api', 'Error fetching ticket incidents', { error, ticketId });
      return [];
    }
  }

  /**
   * Approve or reject a ticket (4-eyes validation)
   */
  async validateTicket(ticketId: number, approved: boolean, reason?: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/api/corrections/${ticketId}/validate`,
        { approved, reason }
      );
      return response.data.success;
    } catch (error) {
      logger.error('api', 'Error validating ticket', { error, ticketId, approved });
      throw error;
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      CRITICAL: 'Critique',
      HIGH: 'Haute',
      MEDIUM: 'Moyenne',
      LOW: 'Faible',
    };
    return labels[priority?.toUpperCase()] || priority;
  }
}

export const validationService = new ValidationService();
