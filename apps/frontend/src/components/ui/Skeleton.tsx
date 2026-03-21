import { type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className = '',
  ...props
}: SkeletonProps) => {
  // Variant styles
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  // Default sizes per variant
  const defaultSizes = {
    text: { height: '1rem', width: '100%' },
    circular: { height: '40px', width: '40px' },
    rectangular: { height: '100px', width: '100%' },
    rounded: { height: '100px', width: '100%' },
  };

  const finalWidth = width || defaultSizes[variant].width;
  const finalHeight = height || defaultSizes[variant].height;

  return (
    <motion.div
      className={`
        relative overflow-hidden
        bg-slate-200 dark:bg-surface-700
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
      }}
      initial={{ opacity: 0.6 }}
      animate={
        animation === 'pulse'
          ? { opacity: [0.6, 1, 0.6] }
          : animation === 'none'
            ? {}
            : {}
      }
      transition={
        animation === 'pulse'
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : {}
      }
      {...props}
    >
      {/* Wave animation overlay */}
      {animation === 'wave' && (
        <motion.div
          className="absolute inset-0 -translate-x-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          }}
          animate={{ translateX: ['−100%', '100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
};

export default Skeleton;

// Preset skeleton components
export const SkeletonText = ({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '70%' : '100%'}
        height="0.875rem"
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div
    className={`bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 p-6 ${className}`}
  >
    <div className="flex items-center gap-4 mb-4">
      <SkeletonAvatar size={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height="1rem" className="mb-2" />
        <Skeleton variant="text" width="40%" height="0.75rem" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 overflow-hidden ${className}`}
  >
    {/* Header */}
    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-surface-800 border-b border-slate-200 dark:border-surface-700">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" height="1rem" className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex gap-4 p-4 border-b border-slate-100 dark:border-surface-700 last:border-0"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            height="0.875rem"
            className="flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ className = '' }: { className?: string }) => (
  <div
    className={`bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 p-6 ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" width="40%" height="0.875rem" />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <Skeleton variant="text" width="60%" height="2rem" className="mb-2" />
    <Skeleton variant="text" width="30%" height="0.75rem" />
  </div>
);

export const SkeletonChart = ({ className = '' }: { className?: string }) => (
  <div
    className={`bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 p-6 ${className}`}
  >
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="text" width="30%" height="1.25rem" />
      <Skeleton variant="rounded" width={100} height={32} />
    </div>
    <Skeleton variant="rounded" height={200} />
  </div>
);
