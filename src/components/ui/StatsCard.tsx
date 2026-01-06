import { useEffect, useState, type ReactNode } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
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
  variant?: 'default' | 'gradient' | 'glass';
  color?: 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

// Animated counter component
const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className="tabular-nums">
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

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
  animate = true,
  className = '',
  onClick,
}: StatsCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Auto-detect trend if previousValue is provided
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

  // Compute trend percentage
  const computedTrendValue = trendValue || (
    previousValue !== undefined && typeof value === 'number' && previousValue !== 0
      ? `${(((value - previousValue) / previousValue) * 100).toFixed(1)}%`
      : undefined
  );

  // Color configurations
  const colorConfig = {
    primary: {
      icon: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      gradient: 'from-primary-500 to-primary-700',
      glow: 'shadow-primary-500/20',
      accent: 'bg-primary-500',
    },
    accent: {
      icon: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
      gradient: 'from-accent-500 to-accent-700',
      glow: 'shadow-accent-500/20',
      accent: 'bg-accent-500',
    },
    gold: {
      icon: 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400',
      gradient: 'from-gold-400 to-gold-600',
      glow: 'shadow-gold-500/20',
      accent: 'bg-gold-500',
    },
    success: {
      icon: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      gradient: 'from-success-500 to-success-700',
      glow: 'shadow-success-500/20',
      accent: 'bg-success-500',
    },
    warning: {
      icon: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      gradient: 'from-warning-400 to-warning-600',
      glow: 'shadow-warning-500/20',
      accent: 'bg-warning-500',
    },
    error: {
      icon: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400',
      gradient: 'from-error-500 to-error-700',
      glow: 'shadow-error-500/20',
      accent: 'bg-error-500',
    },
  };

  // Variant styles
  const variantStyles = {
    default: `
      bg-white dark:bg-surface-900
      border border-slate-200/60 dark:border-surface-700
      shadow-sm hover:shadow-lg
    `,
    gradient: `
      bg-gradient-to-br ${colorConfig[color].gradient}
      text-white
      shadow-lg hover:shadow-xl ${colorConfig[color].glow}
    `,
    glass: `
      glass backdrop-blur-glass
      border border-white/20 dark:border-white/10
      shadow-glass hover:shadow-glass-lg
    `,
  };

  // Trend icon and colors
  const TrendIcon = computedTrend === 'up'
    ? TrendingUp
    : computedTrend === 'down'
      ? TrendingDown
      : Minus;

  const trendColors = {
    up: 'text-success-500 bg-success-50 dark:bg-success-900/30',
    down: 'text-error-500 bg-error-50 dark:bg-error-900/30',
    neutral: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
  };

  // Loading skeleton
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
    <motion.div
      className={`
        relative rounded-xl p-6 overflow-hidden
        transition-all duration-300
        ${variantStyles[variant]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background decoration */}
      {variant === 'default' && (
        <>
          <div
            className={`
              absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20
              ${colorConfig[color].accent}
            `}
            style={{ transform: 'translate(30%, -30%)' }}
          />
          <motion.div
            className={`absolute bottom-0 right-0 w-1 h-full ${colorConfig[color].accent}`}
            initial={{ height: 0 }}
            animate={{ height: isHovered ? '100%' : '30%' }}
            transition={{ duration: 0.3 }}
            style={{ borderRadius: '0 4px 4px 0' }}
          />
        </>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p
            className={`
              text-sm font-medium
              ${variant === 'gradient' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}
            `}
          >
            {title}
          </p>
        </div>
        {icon && (
          <motion.div
            className={`
              p-2.5 rounded-xl
              ${variant === 'gradient' ? 'bg-white/20' : colorConfig[color].icon}
            `}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <h3
          className={`
            text-3xl font-bold tracking-tight
            ${variant === 'gradient' ? 'text-white' : 'text-slate-900 dark:text-white'}
          `}
        >
          {animate && typeof value === 'number' ? (
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          ) : (
            `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}${suffix}`
          )}
        </h3>
      </div>

      {/* Trend / Description */}
      <div className="flex items-center gap-2">
        {computedTrend && computedTrendValue && (
          <motion.div
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${variant === 'gradient' ? 'bg-white/20 text-white' : trendColors[computedTrend]}
            `}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {computedTrend === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : computedTrend === 'down' ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : null}
            {computedTrendValue}
          </motion.div>
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

      {/* Gradient variant shine effect */}
      {variant === 'gradient' && isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
};

export default StatsCard;

// Progress Stats Card variant
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
    <motion.div
      className={`
        bg-white dark:bg-surface-900
        border border-slate-200/60 dark:border-surface-700
        rounded-xl p-6 shadow-sm hover:shadow-lg
        transition-all duration-300
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
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

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-100 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorConfig[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {percentage.toFixed(1)}% complété
      </p>
    </motion.div>
  );
};
