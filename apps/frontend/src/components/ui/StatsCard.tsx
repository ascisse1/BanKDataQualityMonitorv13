import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  variant?: 'default' | 'gradient';
  color?: 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  icon,
  trend,
  trendValue,
  description,
  variant = 'default',
  color = 'primary',
  isLoading = false,
  className = '',
  onClick,
}: StatsCardProps) => {
  const computedTrend = trend || (
    previousValue !== undefined
      ? typeof value === 'number'
        ? value > previousValue
          ? 'up'
          : value < previousValue
            ? 'down'
            : 'neutral'
        : 'neutral'
      : undefined
  );

  const computedTrendValue = trendValue || (
    previousValue !== undefined && typeof value === 'number' && previousValue !== 0
      ? `${(((value - previousValue) / previousValue) * 100).toFixed(1)}%`
      : undefined
  );

  const colorConfig = {
    primary: {
      icon: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      gradient: 'from-primary-500 to-primary-700',
    },
    accent: {
      icon: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
      gradient: 'from-accent-500 to-accent-700',
    },
    gold: {
      icon: 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400',
      gradient: 'from-gold-400 to-gold-600',
    },
    success: {
      icon: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      gradient: 'from-success-500 to-success-700',
    },
    warning: {
      icon: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      gradient: 'from-warning-400 to-warning-600',
    },
    error: {
      icon: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400',
      gradient: 'from-error-500 to-error-700',
    },
  };

  const variantStyles = {
    default: `
      bg-white dark:bg-surface-900
      border border-slate-200/60 dark:border-surface-700
      shadow-sm
    `,
    gradient: `
      bg-gradient-to-br ${colorConfig[color].gradient}
      text-white
      shadow-lg
    `,
  };

  const trendColors = {
    up: 'text-success-500 bg-success-50 dark:bg-success-900/30',
    down: 'text-error-500 bg-error-50 dark:bg-error-900/30',
    neutral: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
  };

  if (isLoading) {
    return (
      <div className={`rounded-xl p-6 ${variantStyles[variant]} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-24" />
            <div className="h-10 w-10 bg-slate-200 dark:bg-surface-700 rounded-xl" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-surface-700 rounded w-32 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-surface-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl p-6
        ${variantStyles[variant]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          className={`
            text-sm font-medium
            ${variant === 'gradient' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}
          `}
        >
          {title}
        </p>
        {icon && (
          <div
            className={`
              p-2.5 rounded-xl
              ${variant === 'gradient' ? 'bg-white/20' : colorConfig[color].icon}
            `}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <h3
          className={`
            text-3xl font-bold tracking-tight tabular-nums
            ${variant === 'gradient' ? 'text-white' : 'text-slate-900 dark:text-white'}
          `}
        >
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        {computedTrend && computedTrendValue && (
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${variant === 'gradient' ? 'bg-white/20 text-white' : trendColors[computedTrend]}
            `}
          >
            {computedTrend === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : computedTrend === 'down' ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : null}
            {computedTrendValue}
          </span>
        )}
        {description && (
          <p
            className={`
              text-xs
              ${variant === 'gradient' ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}
            `}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

export const ProgressStatsCard = ({
  title,
  value,
  maxValue = 100,
  icon,
  color = 'primary',
  className = '',
}: {
  title: string;
  value: number;
  maxValue?: number;
  icon?: ReactNode;
  color?: 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'error';
  className?: string;
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorConfig = {
    primary: 'from-primary-500 to-primary-600',
    accent: 'from-accent-500 to-accent-600',
    gold: 'from-gold-400 to-gold-500',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-400 to-warning-500',
    error: 'from-error-500 to-error-600',
  };

  return (
    <div
      className={`
        bg-white dark:bg-surface-900
        border border-slate-200/60 dark:border-surface-700
        rounded-xl p-6 shadow-sm
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-800">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {value.toLocaleString()}
        </span>
        <span className="text-sm text-slate-400 mb-1">/ {maxValue.toLocaleString()}</span>
      </div>

      <div className="relative h-2 bg-slate-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorConfig[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {percentage.toFixed(1)}% complété
      </p>
    </div>
  );
};
