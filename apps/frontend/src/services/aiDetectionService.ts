/**
 * AI Detection Module Service
 *
 * API client for the AI-powered anomaly detection features.
 * All endpoints require the FEATURE_AI_DETECTION flag to be enabled on the backend.
 */
import { apiService } from './apiService';

// Types

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type SuggestionSource = 'ML_MODEL' | 'LLM_FALLBACK' | 'PATTERN_BASED' | 'NONE';

export interface RiskFactor {
  field: string;
  reason: string;
  contribution: number;
}

export interface RiskScoreDto {
  clientNumber: string;
  riskScore: number;
  confidence: number;
  riskLevel: RiskLevel;
  topRiskFactors: RiskFactor[];
  modelVersion: string;
  computedAt: string;
}

export interface SuggestionAlternative {
  value: string;
  confidence: number;
}

export interface SuggestionResponse {
  suggestionId: number;
  anomalyId: number;
  suggestedValue: string | null;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: SuggestionSource;
  alternatives: SuggestionAlternative[];
  explanation: string | null;
  modelVersion: string;
  generatedAt: string;
}

export interface AiDetectionStatus {
  enabled: boolean;
  features: {
    riskScoring: boolean;
    correctionSuggestions: boolean;
    clustering: boolean;
  };
  modelStatus: Record<string, {
    version: string;
    healthy: boolean;
    lastTrained?: string;
  }>;
  serviceHealth: {
    mlServiceReachable: boolean;
    latencyMs: number;
  };
}

export interface FeedbackRequest {
  accepted: boolean;
  actualValue?: string;
  comment?: string;
}

export interface FeedbackResponse {
  recorded: boolean;
  suggestionId: number;
  feedbackId?: number;
}

export interface AiStatistics {
  highRiskCount: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
  suggestionsRejected: number;
  acceptanceRate: number;
}

// API Service

const aiDetectionService = {
  /**
   * Check if AI Detection module is enabled and get status.
   * Returns 404 if module is disabled.
   */
  getStatus: async (): Promise<AiDetectionStatus | null> => {
    try {
      const response = await apiService.get<{ data: AiDetectionStatus }>('/ai-detection/status');
      return response.data;
    } catch (error: unknown) {
      // Module not enabled - return null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Get correction suggestion for an anomaly.
   */
  getSuggestion: async (anomalyId: number): Promise<SuggestionResponse | null> => {
    try {
      const response = await apiService.get<{ data: SuggestionResponse }>(
        `/ai-detection/suggestion/${anomalyId}`
      );
      return response.data;
    } catch (error: unknown) {
      // No suggestion available
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 204) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Get bulk suggestions for multiple anomalies.
   */
  getBulkSuggestions: async (anomalyIds: number[]): Promise<{
    suggestions: Array<{
      anomalyId: number;
      suggestedValue: string | null;
      confidence: number;
      source: SuggestionSource;
      reason?: string;
    }>;
    processingTimeMs: number;
  }> => {
    const response = await apiService.post<{ data: {
      suggestions: Array<{
        anomalyId: number;
        suggestedValue: string | null;
        confidence: number;
        source: SuggestionSource;
        reason?: string;
      }>;
      processingTimeMs: number;
    } }>('/ai-detection/suggestion', { anomalyIds });
    return response.data;
  },

  /**
   * Submit feedback on a suggestion (for model retraining).
   */
  submitFeedback: async (
    suggestionId: number,
    feedback: FeedbackRequest
  ): Promise<FeedbackResponse> => {
    const response = await apiService.post<{ data: FeedbackResponse }>(
      `/ai-detection/suggestion/${suggestionId}/feedback`,
      feedback
    );
    return response.data;
  },

  /**
   * Get AI module statistics for dashboard.
   */
  getStatistics: async (): Promise<AiStatistics> => {
    const response = await apiService.get<{ data: AiStatistics }>('/ai-detection/statistics');
    return response.data;
  },
};

export default aiDetectionService;
