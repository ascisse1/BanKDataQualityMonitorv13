import { apiService } from './apiService';

export interface PendingValidation {
  id: string;
  ticket_id: string;
  client_id: string;
  client_name: string;
  agent_id: string;
  agent_name: string;
  agency_code: string;
  agency_name: string;
  corrections: CorrectionItem[];
  documents: Document[];
  created_at: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CorrectionItem {
  field: string;
  field_label: string;
  old_value: string | null;
  new_value: string;
  anomaly_type: string;
  severity: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

export interface ValidationDecision {
  validation_id: string;
  decision: 'approved' | 'rejected';
  validator_id: string;
  validator_name: string;
  validator_role: string;
  comments: string;
  validated_at: string;
}

export interface ValidationStats {
  total_pending: number;
  approved_today: number;
  rejected_today: number;
  average_validation_time: number;
  by_agency: {
    agency_code: string;
    agency_name: string;
    pending: number;
  }[];
  by_priority: {
    priority: string;
    count: number;
  }[];
}

class ValidationService {
  async getPendingValidations(filters?: {
    agency_code?: string;
    priority?: string;
    agent_id?: string;
  }): Promise<PendingValidation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.agency_code) params.append('agency_code', filters.agency_code);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.agent_id) params.append('agent_id', filters.agent_id);

      const response = await apiService.get<PendingValidation[]>(
        `/api/validations/pending?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching pending validations:', error);
      return [];
    }
  }

  async getValidationById(id: string): Promise<PendingValidation | null> {
    try {
      return await apiService.get<PendingValidation>(`/api/validations/${id}`);
    } catch (error) {
      console.error('Error fetching validation:', error);
      return null;
    }
  }

  async approveValidation(
    validationId: string,
    validatorId: string,
    validatorName: string,
    validatorRole: string,
    comments: string
  ): Promise<boolean> {
    try {
      await apiService.post('/api/validations/approve', {
        validation_id: validationId,
        validator_id: validatorId,
        validator_name: validatorName,
        validator_role: validatorRole,
        comments,
      });
      return true;
    } catch (error) {
      console.error('Error approving validation:', error);
      return false;
    }
  }

  async rejectValidation(
    validationId: string,
    validatorId: string,
    validatorName: string,
    validatorRole: string,
    comments: string
  ): Promise<boolean> {
    try {
      await apiService.post('/api/validations/reject', {
        validation_id: validationId,
        validator_id: validatorId,
        validator_name: validatorName,
        validator_role: validatorRole,
        comments,
      });
      return true;
    } catch (error) {
      console.error('Error rejecting validation:', error);
      return false;
    }
  }

  async getValidationHistory(filters?: {
    ticket_id?: string;
    client_id?: string;
    agency_code?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ValidationDecision[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.ticket_id) params.append('ticket_id', filters.ticket_id);
      if (filters?.client_id) params.append('client_id', filters.client_id);
      if (filters?.agency_code) params.append('agency_code', filters.agency_code);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiService.get<ValidationDecision[]>(
        `/api/validations/history?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching validation history:', error);
      return [];
    }
  }

  async getValidationStats(agencyCode?: string): Promise<ValidationStats | null> {
    try {
      const url = agencyCode
        ? `/api/validations/stats?agency_code=${agencyCode}`
        : '/api/validations/stats';
      return await apiService.get<ValidationStats>(url);
    } catch (error) {
      console.error('Error fetching validation stats:', error);
      return null;
    }
  }

  async submitForValidation(
    ticketId: string,
    clientId: string,
    agentId: string,
    corrections: CorrectionItem[],
    documentIds: string[]
  ): Promise<boolean> {
    try {
      await apiService.post('/api/validations/submit', {
        ticket_id: ticketId,
        client_id: clientId,
        agent_id: agentId,
        corrections,
        document_ids: documentIds,
      });
      return true;
    } catch (error) {
      console.error('Error submitting for validation:', error);
      return false;
    }
  }

  calculatePriority(anomalies: { severity: string }[]): 'low' | 'medium' | 'high' | 'critical' {
    const hasCritical = anomalies.some(a => a.severity === 'critical');
    const highCount = anomalies.filter(a => a.severity === 'high').length;

    if (hasCritical) return 'critical';
    if (highCount >= 3) return 'high';
    if (highCount >= 1) return 'medium';
    return 'low';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      critical: 'Critique',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[priority] || priority;
  }
}

export const validationService = new ValidationService();
