import { apiService } from './apiService';

export interface WorkflowTask {
  id: string;
  name: string;
  assignee: string;
  created: string;
  due: string;
  processInstanceId: string;
  taskDefinitionKey: string;
}

export interface ProcessVariable {
  [key: string]: any;
}

export interface StartWorkflowRequest {
  ticketId: number;
  clientId: string;
  agencyCode: string;
  priority: string;
}

export interface CompleteTaskRequest {
  userId: number;
  variables?: ProcessVariable;
}

export interface ValidateTaskRequest {
  validatorId: number;
  approved: boolean;
  reason?: string;
}

class WorkflowService {
  private baseUrl = '/api/workflow';

  async startWorkflow(request: StartWorkflowRequest): Promise<string> {
    const response = await apiService.post<{ data: string }>(
      `${this.baseUrl}/start`,
      request
    );
    return response.data;
  }

  async getUserTasks(userId: number): Promise<WorkflowTask[]> {
    const response = await apiService.get<{ data: WorkflowTask[] }>(
      `${this.baseUrl}/tasks/user/${userId}`
    );
    return response.data;
  }

  async getGroupTasks(groupId: string): Promise<WorkflowTask[]> {
    const response = await apiService.get<{ data: WorkflowTask[] }>(
      `${this.baseUrl}/tasks/group/${groupId}`
    );
    return response.data;
  }

  async getTask(taskId: string): Promise<WorkflowTask> {
    const response = await apiService.get<{ data: WorkflowTask }>(
      `${this.baseUrl}/tasks/${taskId}`
    );
    return response.data;
  }

  async claimTask(taskId: string, userId: number): Promise<void> {
    await apiService.post(`${this.baseUrl}/tasks/${taskId}/claim`, {
      userId
    });
  }

  async completeTask(taskId: string, request: CompleteTaskRequest): Promise<void> {
    await apiService.post(`${this.baseUrl}/tasks/${taskId}/complete`, request);
  }

  async validateTask(taskId: string, request: ValidateTaskRequest): Promise<void> {
    await apiService.post(`${this.baseUrl}/tasks/${taskId}/validate`, request);
  }

  async getProcessVariables(processInstanceId: string): Promise<ProcessVariable> {
    const response = await apiService.get<{ data: ProcessVariable }>(
      `${this.baseUrl}/process/${processInstanceId}/variables`
    );
    return response.data;
  }

  async getProcessStatus(processInstanceId: string): Promise<boolean> {
    const response = await apiService.get<{ data: boolean }>(
      `${this.baseUrl}/process/${processInstanceId}/status`
    );
    return response.data;
  }

  async deleteProcess(processInstanceId: string, reason: string): Promise<void> {
    await apiService.delete(
      `${this.baseUrl}/process/${processInstanceId}?reason=${encodeURIComponent(reason)}`
    );
  }
}

export const workflowService = new WorkflowService();
