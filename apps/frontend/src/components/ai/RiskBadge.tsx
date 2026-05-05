/**
 * Risk Badge Component
 *
 * Displays AI-computed risk level with appropriate color coding.
 */
import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { RiskLevel } from '../../services/aiDetectionService';

interface RiskBadgeProps {
  /** Risk score (0-1) */
  score?: number | null;
  /** Risk level classification */
  level?: RiskLevel | null;
  /** Show numeric score */
  showScore?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  bgColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  LOW: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Faible',
  },
  MEDIUM: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Info,
    label: 'Moyen',
  },
  HIGH: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
    label: 'Elevé',
  },
  CRITICAL: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
    label: 'Critique',
  },
};

const SIZE_CONFIG = {
  sm: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    padding: 'px-2 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    icon: 'w-5 h-5',
  },
};

/**
 * Determine risk level from numeric score.
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.3) return 'MEDIUM';
  return 'LOW';
}

/**
 * Risk Badge component displaying AI risk assessment.
 */
export function RiskBadge({
  score,
  level,
  showScore = false,
  size = 'sm',
}: RiskBadgeProps) {
  // No data available
  if (score == null && level == null) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  // Determine risk level
  const riskLevel = level ?? (score != null ? getRiskLevel(score) : 'LOW');
  const config = RISK_CONFIG[riskLevel];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.color}
        ${sizeConfig.padding} ${sizeConfig.text}
      `}
      title={`Risque: ${config.label}${score != null ? ` (${Math.round(score * 100)}%)` : ''}`}
    >
      <Icon className={sizeConfig.icon} />
      {showScore && score != null ? (
        <span>{Math.round(score * 100)}%</span>
      ) : (
        <span>{config.label}</span>
      )}
    </span>
  );
}

export default RiskBadge;
