import { apiService } from './apiService';

export interface ReconciliationTask {
  id: string;
  ticket_id: string;
  client_id: string;
  client_name: string;
  corrections: CorrectionItem[];
  status: 'pending' | 'reconciled' | 'failed' | 'partial';
  created_at: string;
  reconciled_at?: string;
  attempts: number;
  last_attempt_at?: string;
  error_message?: string;
}

export interface CorrectionItem {
  field: string;
  field_label: string;
  expected_value: string;
  cbs_value: string | null;
  is_matched: boolean;
  last_checked_at?: string;
}

export interface ReconciliationResult {
  task_id: string;
  status: 'success' | 'partial' | 'failed';
  matched_fields: number;
  total_fields: number;
  discrepancies: Discrepancy[];
  checked_at: string;
}

export interface Discrepancy {
  field: string;
  field_label: string;
  expected_value: string;
  actual_value: string | null;
  severity: 'low' | 'medium' | 'high';
}

export interface ReconciliationStats {
  total_pending: number;
  reconciled_today: number;
  failed_today: number;
  success_rate: number;
  average_reconciliation_time: number;
  by_status: {
    status: string;
    count: number;
  }[];
}

class ReconciliationService {
  async getPendingReconciliations(filters?: {
    agency_code?: string;
    client_id?: string;
  }): Promise<ReconciliationTask[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.agency_code) params.append('agency_code', filters.agency_code);
      if (filters?.client_id) params.append('client_id', filters.client_id);

      const response = await apiService.get<ReconciliationTask[]>(
        `/api/reconciliation/pending?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching pending reconciliations:', error);
      return [];
    }
  }

  async getReconciliationById(id: string): Promise<ReconciliationTask | null> {
    try {
      return await apiService.get<ReconciliationTask>(`/api/reconciliation/${id}`);
    } catch (error) {
      console.error('Error fetching reconciliation:', error);
      return null;
    }
  }

  async reconcileTask(taskId: string): Promise<ReconciliationResult | null> {
    try {
      return await apiService.post<ReconciliationResult>(
        `/api/reconciliation/${taskId}/reconcile`,
        {}
      );
    } catch (error) {
      console.error('Error reconciling task:', error);
      return null;
    }
  }

  async reconcileAll(filters?: {
    agency_code?: string;
    max_tasks?: number;
  }): Promise<{ success: number; failed: number; total: number }> {
    try {
      const response = await apiService.post<{ success: number; failed: number; total: number }>(
        '/api/reconciliation/reconcile-all',
        filters || {}
      );
      return response;
    } catch (error) {
      console.error('Error reconciling all tasks:', error);
      return { success: 0, failed: 0, total: 0 };
    }
  }

  async retryReconciliation(taskId: string): Promise<ReconciliationResult | null> {
    try {
      return await apiService.post<ReconciliationResult>(
        `/api/reconciliation/${taskId}/retry`,
        {}
      );
    } catch (error) {
      console.error('Error retrying reconciliation:', error);
      return null;
    }
  }

  async closeTicket(ticketId: string, userId: string, comments: string): Promise<boolean> {
    try {
      await apiService.post(`/api/reconciliation/${ticketId}/close`, {
        user_id: userId,
        comments,
      });
      return true;
    } catch (error) {
      console.error('Error closing ticket:', error);
      return false;
    }
  }

  async getReconciliationStats(agencyCode?: string): Promise<ReconciliationStats | null> {
    try {
      const url = agencyCode
        ? `/api/reconciliation/stats?agency_code=${agencyCode}`
        : '/api/reconciliation/stats';
      return await apiService.get<ReconciliationStats>(url);
    } catch (error) {
      console.error('Error fetching reconciliation stats:', error);
      return null;
    }
  }

  async getReconciliationHistory(filters?: {
    ticket_id?: string;
    client_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<ReconciliationTask[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.ticket_id) params.append('ticket_id', filters.ticket_id);
      if (filters?.client_id) params.append('client_id', filters.client_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiService.get<ReconciliationTask[]>(
        `/api/reconciliation/history?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching reconciliation history:', error);
      return [];
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'reconciled':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      reconciled: 'Réconcilié',
      failed: 'Échec',
      partial: 'Partiel',
    };
    return labels[status] || status;
  }

  calculateMatchPercentage(matched: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((matched / total) * 100);
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[severity] || severity;
  }
}

export const reconciliationService = new ReconciliationService();
