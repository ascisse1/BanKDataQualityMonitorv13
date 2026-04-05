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

  /** Chat with conversation history (blocking) */
  chat: (message: string, history: ChatMessage[]) =>
    apiService.post<AiResponse>('/ai/chat', { message, history }),

  /**
   * Streaming chat via SSE — tokens arrive in real-time.
   * Returns an abort function to cancel the stream.
   */
  streamChat: (
    message: string,
    history: ChatMessage[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (error: string) => void,
  ): (() => void) => {
    const controller = new AbortController();

    // Get CSRF token from cookie for the POST request
    const csrfToken = document.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(csrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfToken) } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          onError(`Faro erreur HTTP ${response.status}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          onError('Streaming non supporte');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events: "data:token\n\n"
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const token = line.slice(5);
              if (token) onToken(token);
            }
          }
        }

        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError('Impossible de contacter Faro');
        }
      });

    return () => controller.abort();
  },

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
