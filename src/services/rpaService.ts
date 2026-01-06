import { apiService } from './apiService';

export interface RpaJob {
  id: number;
  jobId: string;
  ticketId: number;
  processInstanceId?: string;
  action: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  resultData?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StartRpaJobRequest {
  ticketId: number;
  processInstanceId: string;
  action: string;
}

export interface RpaCallbackRequest {
  jobId: string;
  status: string;
  errorMessage?: string;
  resultData?: string;
}

class RpaService {
  private baseUrl = '/api/rpa';

  async startJob(request: StartRpaJobRequest): Promise<{ jobId: string }> {
    const response = await apiService.post<{ data: { jobId: string } }>(
      `${this.baseUrl}/jobs/start`,
      request
    );
    return response.data;
  }

  async getJob(jobId: string): Promise<RpaJob> {
    const response = await apiService.get<{ data: RpaJob }>(
      `${this.baseUrl}/jobs/${jobId}`
    );
    return response.data;
  }

  async getJobsByTicket(ticketId: number): Promise<RpaJob[]> {
    const response = await apiService.get<{ data: RpaJob[] }>(
      `${this.baseUrl}/jobs/ticket/${ticketId}`
    );
    return response.data;
  }

  async getJobsByStatus(status: string): Promise<RpaJob[]> {
    const response = await apiService.get<{ data: RpaJob[] }>(
      `${this.baseUrl}/jobs/status/${status}`
    );
    return response.data;
  }

  async retryJob(jobId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/jobs/${jobId}/retry`);
  }

  async getStuckJobs(timeoutMinutes: number = 30): Promise<RpaJob[]> {
    const response = await apiService.get<{ data: RpaJob[] }>(
      `${this.baseUrl}/jobs/stuck?timeoutMinutes=${timeoutMinutes}`
    );
    return response.data;
  }

  async cleanupStuckJobs(timeoutMinutes: number = 30): Promise<void> {
    await apiService.post(
      `${this.baseUrl}/jobs/cleanup-stuck?timeoutMinutes=${timeoutMinutes}`
    );
  }

  getStatusBadgeClass(status: RpaJob['status']): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const rpaService = new RpaService();
