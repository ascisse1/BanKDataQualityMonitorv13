import apiClient from '../lib/apiClient';
import { log } from './log';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  agencyCode: string;
}

export interface TicketDto {
  id: number;
  ticketNumber: string;
  cli: string;
  clientName: string;
  clientType: string;
  agencyCode: string;
  status: string;
  priority: string;
  assignedTo: UserDto | null;
  assignedBy: UserDto | null;
  assignedAt: string | null;
  validatedBy: UserDto | null;
  validatedAt: string | null;
  slaDeadline: string | null;
  slaBreached: boolean;
  totalIncidents: number;
  resolvedIncidents: number;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const ticketService = {
  async getTickets(page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC'): Promise<PageResponse<TicketDto>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<TicketDto>>>(
        `/api/tickets?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to fetch tickets', { error });
      throw error;
    }
  },

  async getTicketsByAgency(agencyCode: string, page = 0, size = 20): Promise<PageResponse<TicketDto>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<TicketDto>>>(
        `/api/tickets/agency/${agencyCode}?page=${page}&size=${size}`
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to fetch agency tickets', { error, agencyCode });
      throw error;
    }
  },

  async getMyTickets(page = 0, size = 20): Promise<PageResponse<TicketDto>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<TicketDto>>>(
        `/api/tickets/assigned-to-me?page=${page}&size=${size}`
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to fetch my tickets', { error });
      throw error;
    }
  },

  async getTicketById(id: number): Promise<TicketDto> {
    try {
      const response = await apiClient.get<ApiResponse<TicketDto>>(
        `/api/tickets/${id}`
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to fetch ticket', { error, id });
      throw error;
    }
  },

  async updateTicketStatus(id: number, status: string, notes?: string): Promise<TicketDto> {
    try {
      const response = await apiClient.patch<ApiResponse<TicketDto>>(
        `/api/tickets/${id}/status`,
        { status, notes }
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to update ticket status', { error, id, status });
      throw error;
    }
  },

  async assignTicket(id: number, assignedToUserId: number): Promise<TicketDto> {
    try {
      const response = await apiClient.post<ApiResponse<TicketDto>>(
        `/api/tickets/${id}/assign`,
        { assignedToUserId }
      );
      return response.data.data;
    } catch (error) {
      log.error('api', 'Failed to assign ticket', { error, id });
      throw error;
    }
  },
};

export default ticketService;
