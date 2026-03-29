import { apiService } from './apiService';
import { log } from './log';

export interface ReconciliationTask {
  id: string;
  ticket_id: string;
  client_id: string;
  client_name: string;
  corrections: CorrectionItem[];
  status: 'pending' | 'in_progress' | 'reconciled' | 'failed' | 'partial' | 'abandoned';
  created_at: string;
  reconciled_at?: string;
  abandoned_at?: string;
  abandoned_reason?: string;
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
  status: 'success' | 'partial' | 'failed' | 'abandoned';
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
  total_abandoned: number;
  success_rate: number;
  average_reconciliation_time: number;
  by_status: {
    status: string;
    count: number;
  }[];
}

export interface AbandonResult {
  task_id: string;
  status: 'abandoned';
  anomalies_created: number;
  anomaly_ids: number[];
}

class ReconciliationService {
  async getPendingReconciliations(filters?: {
    structureCode?: string;
    clientId?: string;
  }): Promise<ReconciliationTask[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.structureCode) params.append('structureCode', filters.structureCode);
      if (filters?.clientId) params.append('clientId', filters.clientId);

      return await apiService.get<ReconciliationTask[]>(
        `/reconciliation/pending?${params.toString()}`
      );
    } catch (error) {
      log.error('api', 'Error fetching pending reconciliations', { error });
      return [];
    }
  }

  async reconcileTask(taskId: string): Promise<ReconciliationResult | null> {
    try {
      return await apiService.post<ReconciliationResult>(
        `/reconciliation/${taskId}/reconcile`,
        {}
      );
    } catch (error) {
      log.error('api', 'Error reconciling task', { error });
      return null;
    }
  }

  async reconcileAll(filters?: {
    structure_code?: string;
    max_tasks?: number;
  }): Promise<{ success: number; failed: number; abandoned: number; total: number }> {
    try {
      return await apiService.post<{ success: number; failed: number; abandoned: number; total: number }>(
        '/reconciliation/reconcile-all',
        filters || {}
      );
    } catch (error) {
      log.error('api', 'Error reconciling all tasks', { error });
      return { success: 0, failed: 0, abandoned: 0, total: 0 };
    }
  }

  async retryReconciliation(taskId: string): Promise<ReconciliationResult | null> {
    try {
      return await apiService.post<ReconciliationResult>(
        `/reconciliation/${taskId}/retry`,
        {}
      );
    } catch (error) {
      log.error('api', 'Error retrying reconciliation', { error });
      return null;
    }
  }

  async abandonAndCreateAnomaly(taskId: string): Promise<AbandonResult | null> {
    try {
      return await apiService.post<AbandonResult>(
        `/reconciliation/${taskId}/abandon`,
        {}
      );
    } catch (error) {
      log.error('api', 'Error abandoning task', { error });
      return null;
    }
  }

  async getReconciliationStats(structureCode?: string): Promise<ReconciliationStats | null> {
    try {
      const url = structureCode
        ? `/reconciliation/stats?structureCode=${structureCode}`
        : '/reconciliation/stats';
      return await apiService.get<ReconciliationStats>(url);
    } catch (error) {
      log.error('api', 'Error fetching reconciliation stats', { error });
      return null;
    }
  }

  async getReconciliationHistory(filters?: {
    ticketId?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ReconciliationTask[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.ticketId) params.append('ticketId', filters.ticketId);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      return await apiService.get<ReconciliationTask[]>(
        `/reconciliation/history?${params.toString()}`
      );
    } catch (error) {
      log.error('api', 'Error fetching reconciliation history', { error });
      return [];
    }
  }

  async closeTicket(ticketId: string, userId: string, comments: string): Promise<boolean> {
    try {
      await apiService.post(`/reconciliation/${ticketId}/close`, {
        user_id: userId,
        comments,
      });
      return true;
    } catch (error) {
      log.error('api', 'Error closing ticket', { error });
      return false;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'reconciled':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-orange-600 bg-orange-100';
      case 'abandoned':
        return 'text-gray-600 bg-gray-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      reconciled: 'Réconcilié',
      failed: 'Échec',
      partial: 'Partiel',
      abandoned: 'Abandonné',
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
