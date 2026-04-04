import { apiService } from './apiService';

export interface AiResponse {
  data: {
    answer: string;
    model: string;
    durationMs: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type FaroStatus = 'ready' | 'downloading' | 'offline';

export interface AiStatusResponse {
  data: {
    enabled: boolean;
    available: boolean;
    serverReachable: boolean;
    modelReady: boolean;
    status: FaroStatus;
  };
}

const aiService = {
  /** Check if the AI backend is enabled and Ollama is reachable */
  getStatus: () =>
    apiService.get<AiStatusResponse>('/ai/status'),

  /** Free-form question with optional context */
  ask: (question: string, context?: {
    clientNumber?: string;
    fieldName?: string;
    currentValue?: string;
    errorMessage?: string;
    structureCode?: string;
  }) =>
    apiService.post<AiResponse>('/ai/ask', { question, ...context }),

  /** Chat with conversation history */
  chat: (message: string, history: ChatMessage[]) =>
    apiService.post<AiResponse>('/ai/chat', { message, history }),

  /** Explain an anomaly */
  explainAnomaly: (anomaly: Record<string, unknown>) =>
    apiService.post<AiResponse>('/ai/explain-anomaly', anomaly),

  /** Suggest a correction for an anomaly */
  suggestCorrection: (anomaly: Record<string, unknown>) =>
    apiService.post<AiResponse>('/ai/suggest-correction', anomaly),

  /** Generate a narrative report from statistics */
  generateReportNarrative: (stats: Record<string, unknown>) =>
    apiService.post<AiResponse>('/ai/report-narrative', stats),

  /** Analyze patterns across anomalies */
  analyzePatterns: (anomalies: Record<string, unknown>[]) =>
    apiService.post<AiResponse>('/ai/analyze-patterns', anomalies),
};

export default aiService;
