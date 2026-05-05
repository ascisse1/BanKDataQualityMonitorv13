/**
 * AI Insights Dashboard Widget
 *
 * Displays AI module statistics and insights on the dashboard.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import aiDetectionService, { AiStatistics } from '../../services/aiDetectionService';
import { useAiDetection } from '../../hooks/useAiDetection';

interface AiInsightsWidgetProps {
  /** CSS class name */
  className?: string;
}

/**
 * AI Insights widget for the dashboard.
 */
export function AiInsightsWidget({ className = '' }: AiInsightsWidgetProps) {
  const { isEnabled, isServiceHealthy, hasRiskScoring, hasSuggestions } = useAiDetection();

  // Fetch statistics
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-detection-statistics'],
    queryFn: () => aiDetectionService.getStatistics(),
    enabled: isEnabled,
    staleTime: 60_000, // Refresh every minute
    refetchInterval: 60_000,
  });

  // Module not enabled
  if (!isEnabled) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-400">Module IA</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Module IA non activé</p>
          <p className="text-xs mt-1">
            Contactez l'administrateur pour activer FEATURE_AI_DETECTION
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Insights IA</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Insights IA</h3>
        </div>
        <div className="text-center py-6 text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Erreur de chargement des statistiques</p>
        </div>
      </div>
    );
  }

  const acceptanceRatePercent = Math.round((stats.acceptanceRate ?? 0) * 100);

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Insights IA</h3>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isServiceHealthy ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500">
            {isServiceHealthy ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* High Risk Records */}
        {hasRiskScoring && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800">
                Risque élevé
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {stats.highRiskCount}
            </div>
            <div className="text-xs text-orange-600">enregistrements</div>
          </div>
        )}

        {/* Suggestions Accepted */}
        {hasSuggestions && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">
                Acceptées
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.suggestionsAccepted}
            </div>
            <div className="text-xs text-green-600">suggestions</div>
          </div>
        )}

        {/* Suggestions Rejected */}
        {hasSuggestions && (
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800">
                Rejetées
              </span>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {stats.suggestionsRejected}
            </div>
            <div className="text-xs text-red-600">suggestions</div>
          </div>
        )}

        {/* Acceptance Rate */}
        {hasSuggestions && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">
                Taux d'acceptation
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {acceptanceRatePercent}%
            </div>
            <div className="text-xs text-blue-600">précision</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Total: {stats.suggestionsGenerated} suggestions générées
          </span>
          <span className="text-gray-400">Dernière mise à jour: maintenant</span>
        </div>
      </div>
    </div>
  );
}

export default AiInsightsWidget;
