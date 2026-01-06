import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataQualityGaugeProps {
  value: number; // 0-100
  previousValue?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTrend?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

const DataQualityGauge = ({
  value,
  previousValue,
  size = 'lg',
  showTrend = true,
  showLabel = true,
  label = 'Score Qualité',
  animate = true,
  className = '',
}: DataQualityGaugeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 'text-xl', labelSize: 'text-xs' },
    md: { width: 160, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 200, strokeWidth: 12, fontSize: 'text-4xl', labelSize: 'text-sm' },
    xl: { width: 240, strokeWidth: 14, fontSize: 'text-5xl', labelSize: 'text-base' },
  };

  const { width, strokeWidth, fontSize, labelSize } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animated value
  const springValue = useSpring(0, {
    mass: 0.8,
    stiffness: 50,
    damping: 15,
  });

  const displayValue = useTransform(springValue, (val) => Math.round(val));
  const progressOffset = useTransform(
    springValue,
    (val) => circumference - (val / 100) * circumference
  );

  useEffect(() => {
    if (animate) {
      springValue.set(value);
    } else {
      springValue.set(value);
    }
  }, [value, animate, springValue]);

  // Determine color based on value
  const getColor = (val: number) => {
    if (val >= 90) return { stroke: '#10b981', bg: 'bg-success-500', text: 'text-success-500' };
    if (val >= 70) return { stroke: '#06c4b0', bg: 'bg-accent-500', text: 'text-accent-500' };
    if (val >= 50) return { stroke: '#f59e0b', bg: 'bg-warning-500', text: 'text-warning-500' };
    return { stroke: '#ef4444', bg: 'bg-error-500', text: 'text-error-500' };
  };

  const color = getColor(value);

  // Calculate trend
  const trend = previousValue !== undefined
    ? value > previousValue
      ? 'up'
      : value < previousValue
        ? 'down'
        : 'neutral'
    : undefined;

  const trendPercentage = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue * 100).toFixed(1)
    : undefined;

  return (
    <motion.div
      className={`relative flex flex-col items-center ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* SVG Gauge */}
      <div className="relative" style={{ width, height: width }}>
        <svg
          width={width}
          height={width}
          viewBox={`0 0 ${width} ${width}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-surface-700"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gauge-gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color.stroke} />
              <stop offset="100%" stopColor={color.stroke} stopOpacity={0.7} />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Progress circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={`url(#gauge-gradient-${value})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: progressOffset }}
            filter={isHovered ? 'url(#glow)' : undefined}
          />

          {/* Animated dots on the progress */}
          {isHovered && (
            <motion.circle
              cx={width / 2}
              cy={strokeWidth / 2}
              r={4}
              fill={color.stroke}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                rotate: [0, 360 * (value / 100)],
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ transformOrigin: `${width / 2}px ${width / 2}px` }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Value */}
          <motion.span
            className={`${fontSize} font-bold ${color.text} tabular-nums`}
          >
            <motion.span>{displayValue}</motion.span>
            <span className="text-lg">%</span>
          </motion.span>

          {/* Label */}
          {showLabel && (
            <span className={`${labelSize} text-slate-500 dark:text-slate-400 font-medium mt-1`}>
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Trend indicator */}
      {showTrend && trend && trendPercentage && (
        <motion.div
          className={`
            mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            ${trend === 'up'
              ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
              : trend === 'down'
                ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }
          `}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4" />}
          {trend === 'neutral' && <Minus className="w-4 h-4" />}
          <span>{trend === 'up' ? '+' : ''}{trendPercentage}%</span>
        </motion.div>
      )}

      {/* Status badge */}
      <motion.div
        className={`
          mt-2 px-3 py-1 rounded-full text-xs font-medium
          ${color.bg} text-white
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
      >
        {value >= 90 ? 'Excellent' : value >= 70 ? 'Bon' : value >= 50 ? 'Moyen' : 'Critique'}
      </motion.div>
    </motion.div>
  );
};

export default DataQualityGauge;

// Mini gauge for compact displays
export const MiniGauge = ({
  value,
  size = 60,
  className = '',
}: {
  value: number;
  size?: number;
  className?: string;
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 90) return '#10b981';
    if (val >= 70) return '#06c4b0';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-surface-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {value}%
        </span>
      </div>
    </div>
  );
};
