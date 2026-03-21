import { AxiosInstance } from 'axios';
import apiClient from '../lib/apiClient';

export interface ReconciliationTask {
  id: string;
  ticket_id: string;
  client_id: string;
  client_name?: string;
  agency_code?: string;
  status: 'pending' | 'reconciled' | 'partial' | 'failed';
  created_at: string;
  reconciled_at?: string;
  attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  corrections: Correction[];
}

export interface Correction {
  field_name: string;
  field_label: string;
  old_value: string;
  new_value: string;
  cbs_value?: string;
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
  actual_value: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReconciliationStats {
  total_pending: number;
  reconciled_today: number;
  failed_today: number;
  success_rate: number;
  average_reconciliation_time: number;
  by_status: Array<{ status: string; count: number }>;
}


class ReconciliationApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = apiClient;
  }

  async getPendingTasks(agencyCode?: string, clientId?: string): Promise<ReconciliationTask[]> {
    const response = await this.axiosInstance.get('/api/reconciliation/pending', {
      params: { agencyCode, clientId }
    });
    return response.data;
  }

  async getHistory(params: {
    ticketId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ReconciliationTask[]> {
    const response = await this.axiosInstance.get('/api/reconciliation/history', {
      params
    });
    return response.data;
  }

  async reconcileTask(taskId: string): Promise<ReconciliationResult> {
    const response = await this.axiosInstance.post(
      `/api/reconciliation/${taskId}/reconcile`,
      {}
    );
    return response.data;
  }

  async retryReconciliation(taskId: string): Promise<ReconciliationResult> {
    const response = await this.axiosInstance.post(
      `/api/reconciliation/${taskId}/retry`,
      {}
    );
    return response.data;
  }

  async reconcileAll(agencyCode?: string, maxTasks: number = 50): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    const response = await this.axiosInstance.post(
      '/api/reconciliation/reconcile-all',
      { agency_code: agencyCode, max_tasks: maxTasks }
    );
    return response.data;
  }

  async getStats(agencyCode?: string): Promise<ReconciliationStats> {
    const response = await this.axiosInstance.get('/api/reconciliation/stats', {
      params: { agencyCode }
    });
    return response.data;
  }

  async checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {

    const response = await this.axiosInstance.get('/api/reconciliation/health');
    return response.data;
  }
}

export const reconciliationApiService = new ReconciliationApiService();
