/**
 * Hook for AI Detection module feature detection and status.
 *
 * Provides information about whether AI features are enabled
 * and available for use in the UI.
 */
import { useQuery } from '@tanstack/react-query';
import aiDetectionService, { AiDetectionStatus } from '../services/aiDetectionService';

export interface AiDetectionState {
  /** Whether the query is still loading */
  isLoading: boolean;
  /** Whether the AI Detection module is enabled on the backend */
  isEnabled: boolean;
  /** Whether risk scoring feature is enabled */
  hasRiskScoring: boolean;
  /** Whether correction suggestions feature is enabled */
  hasSuggestions: boolean;
  /** Whether anomaly clustering feature is enabled */
  hasClustering: boolean;
  /** Whether the ML service is reachable */
  isServiceHealthy: boolean;
  /** Full status response (null if disabled) */
  status: AiDetectionStatus | null;
  /** Error message if status check failed */
  error: string | null;
  /** Refetch status */
  refetch: () => void;
}

/**
 * Hook to detect and monitor AI Detection module availability.
 *
 * @param enabled - Whether to enable the status query (default: true)
 * @returns AI Detection state
 *
 * @example
 * ```tsx
 * function AnomalyRow({ anomaly }) {
 *   const { hasRiskScoring, hasSuggestions } = useAiDetection();
 *
 *   return (
 *     <tr>
 *       <td>{anomaly.clientNumber}</td>
 *       {hasRiskScoring && <td><RiskBadge score={anomaly.aiRiskScore} /></td>}
 *       {hasSuggestions && <td><SuggestionBadge anomalyId={anomaly.id} /></td>}
 *     </tr>
 *   );
 * }
 * ```
 */
export function useAiDetection(enabled = true): AiDetectionState {
  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-detection-status'],
    queryFn: () => aiDetectionService.getStatus(),
    enabled,
    staleTime: 60_000, // Recheck every minute
    gcTime: 5 * 60_000, // Cache for 5 minutes
    retry: false, // Don't retry if module is disabled (404)
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    isEnabled: status?.enabled ?? false,
    hasRiskScoring: status?.features?.riskScoring ?? false,
    hasSuggestions: status?.features?.correctionSuggestions ?? false,
    hasClustering: status?.features?.clustering ?? false,
    isServiceHealthy: status?.serviceHealth?.mlServiceReachable ?? false,
    status: status ?? null,
    error: error ? 'AI module unavailable' : null,
    refetch,
  };
}

export default useAiDetection;
