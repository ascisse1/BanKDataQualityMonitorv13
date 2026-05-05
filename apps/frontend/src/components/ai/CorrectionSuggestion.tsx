/**
 * Correction Suggestion Component
 *
 * Displays AI-generated correction suggestions with accept/reject actions.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Check, X, Loader2, ChevronDown } from 'lucide-react';
import aiDetectionService, {
  SuggestionResponse,
  ConfidenceLevel,
} from '../../services/aiDetectionService';
import { useAiDetection } from '../../hooks/useAiDetection';

interface CorrectionSuggestionProps {
  /** Anomaly ID to get suggestion for */
  anomalyId: number;
  /** Current field value */
  currentValue?: string;
  /** Callback when suggestion is applied */
  onApply?: (value: string) => void;
  /** Compact display mode */
  compact?: boolean;
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  LOW: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Faible',
  },
  MEDIUM: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Moyenne',
  },
  HIGH: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Haute',
  },
};

/**
 * Correction Suggestion component with ML-powered suggestions.
 */
export function CorrectionSuggestion({
  anomalyId,
  currentValue,
  onApply,
  compact = false,
}: CorrectionSuggestionProps) {
  const queryClient = useQueryClient();
  const { hasSuggestions } = useAiDetection();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Fetch suggestion
  const {
    data: suggestion,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-suggestion', anomalyId],
    queryFn: () => aiDetectionService.getSuggestion(anomalyId),
    enabled: hasSuggestions && !!anomalyId,
    staleTime: 60_000, // Cache for 1 minute
    retry: false,
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: ({
      accepted,
      actualValue,
    }: {
      accepted: boolean;
      actualValue?: string;
    }) => {
      if (!suggestion?.suggestionId) {
        throw new Error('No suggestion ID');
      }
      return aiDetectionService.submitFeedback(suggestion.suggestionId, {
        accepted,
        actualValue,
      });
    },
    onSuccess: () => {
      setFeedbackSent(true);
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: ['ai-detection-statistics'] });
    },
  });

  // Don't render if AI suggestions not available
  if (!hasSuggestions) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Chargement...</span>
      </div>
    );
  }

  // Error or no suggestion
  if (error || !suggestion || !suggestion.suggestedValue) {
    return null;
  }

  // Same as current value - no need to show
  if (suggestion.suggestedValue === currentValue) {
    return null;
  }

  const confidenceStyle = CONFIDENCE_STYLES[suggestion.confidenceLevel];
  const confidencePercent = Math.round(suggestion.confidence * 100);

  // Handle apply
  const handleApply = () => {
    if (suggestion.suggestedValue && onApply) {
      onApply(suggestion.suggestedValue);
      feedbackMutation.mutate({
        accepted: true,
        actualValue: suggestion.suggestedValue,
      });
    }
  };

  // Handle reject
  const handleReject = () => {
    feedbackMutation.mutate({ accepted: false });
  };

  // Compact mode
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-blue-500" />
        <span
          className="text-sm text-blue-700 font-medium truncate max-w-[120px]"
          title={suggestion.suggestedValue}
        >
          {suggestion.suggestedValue}
        </span>
        <span className={`text-xs ${confidenceStyle.color}`}>
          ({confidencePercent}%)
        </span>
        {!feedbackSent && (
          <>
            <button
              onClick={handleApply}
              className="p-0.5 hover:bg-green-100 rounded"
              title="Appliquer"
            >
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button
              onClick={handleReject}
              className="p-0.5 hover:bg-red-100 rounded"
              title="Rejeter"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Suggestion header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-900">
              Suggestion IA
            </span>
            <span
              className={`
                px-1.5 py-0.5 rounded text-xs font-medium
                ${confidenceStyle.bgColor} ${confidenceStyle.color}
              `}
            >
              {confidencePercent}% {confidenceStyle.label}
            </span>
            {suggestion.source !== 'ML_MODEL' && (
              <span className="text-xs text-gray-500">
                ({suggestion.source === 'LLM_FALLBACK' ? 'LLM' : 'Pattern'})
              </span>
            )}
          </div>

          {/* Suggested value */}
          <div className="bg-white rounded border border-blue-100 px-2 py-1.5 mb-2">
            <code className="text-sm text-blue-900 break-all">
              {suggestion.suggestedValue}
            </code>
          </div>

          {/* Explanation */}
          {suggestion.explanation && (
            <p className="text-xs text-gray-600 mb-2">{suggestion.explanation}</p>
          )}

          {/* Alternatives */}
          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showAlternatives ? 'rotate-180' : ''
                  }`}
                />
                {suggestion.alternatives.length} alternative
                {suggestion.alternatives.length > 1 ? 's' : ''}
              </button>

              {showAlternatives && (
                <div className="mt-1 space-y-1">
                  {suggestion.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                    >
                      <code className="text-gray-700">{alt.value}</code>
                      <span className="text-gray-500">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!feedbackSent ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleApply}
                disabled={feedbackMutation.isPending}
                className="
                  flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-green-600 text-white hover:bg-green-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Check className="w-4 h-4" />
                Appliquer
              </button>
              <button
                onClick={handleReject}
                disabled={feedbackMutation.isPending}
                className="
                  flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <X className="w-4 h-4" />
                Rejeter
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              Merci pour votre retour !
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CorrectionSuggestion;
