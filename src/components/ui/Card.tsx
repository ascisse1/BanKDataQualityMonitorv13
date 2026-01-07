<<<<<<< HEAD
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type CardVariant = 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<'div'>> {
  children?: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  headerAction?: ReactNode;
  icon?: ReactNode;
  variant?: CardVariant;
  isLoading?: boolean;
  isHoverable?: boolean;
  isClickable?: boolean;
  noPadding?: boolean;
  gradient?: 'primary' | 'accent' | 'gold' | 'success' | 'error';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      title,
      description,
      footer,
      headerAction,
      icon,
      variant = 'default',
      isLoading = false,
      isHoverable = true,
      isClickable = false,
      noPadding = false,
      gradient,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = `
      relative rounded-xl overflow-hidden
      transition-all duration-300 ease-out
    `;

    // Variant styles
    const variantStyles: Record<CardVariant, string> = {
      default: `
        bg-white dark:bg-surface-900
        border border-slate-200/60 dark:border-surface-700
        shadow-sm
      `,
      glass: `
        glass backdrop-blur-glass
        border border-white/20 dark:border-white/10
      `,
      gradient: `
        bg-gradient-to-br
        ${gradient === 'primary' ? 'from-primary-500 to-primary-700 text-white' : ''}
        ${gradient === 'accent' ? 'from-accent-500 to-accent-700 text-white' : ''}
        ${gradient === 'gold' ? 'from-gold-400 to-gold-600 text-slate-900' : ''}
        ${gradient === 'success' ? 'from-success-500 to-success-700 text-white' : ''}
        ${gradient === 'error' ? 'from-error-500 to-error-700 text-white' : ''}
        ${!gradient ? 'from-primary-500 to-accent-500 text-white' : ''}
        shadow-lg
      `,
      elevated: `
        bg-white dark:bg-surface-900
        shadow-lg dark:shadow-2xl
        border border-transparent
      `,
      bordered: `
        bg-white dark:bg-surface-900
        border-2 border-slate-200 dark:border-surface-700
      `,
    };

    // Hover styles
    const hoverStyles = isHoverable
      ? 'hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-xl'
      : '';

    // Clickable styles
    const clickableStyles = isClickable ? 'cursor-pointer active:scale-[0.99]' : '';

    // Animation variants
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
      <div className="animate-pulse">
        {title && <div className="h-6 bg-slate-200 dark:bg-surface-700 rounded-lg w-3/4 mb-3" />}
        {description && (
          <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-1/2 mb-6" />
        )}
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded" />
          <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-surface-700 rounded w-4/6" />
        </div>
      </div>
    );

    return (
      <motion.div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${hoverStyles}
          ${clickableStyles}
          ${className}
        `}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={isHoverable ? { y: -4 } : {}}
        whileTap={isClickable ? { scale: 0.99 } : {}}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {/* Gradient overlay for glass variant */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        )}

        {/* Subtle corner accent */}
        {variant === 'default' && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full" />
        )}

        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : (
          <>
            {/* Header */}
            {(title || description || icon || headerAction) && (
              <div className={`${noPadding ? '' : 'px-6 pt-6 pb-3'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {icon && (
                      <div
                        className={`
                        flex-shrink-0 p-2.5 rounded-xl
                        ${variant === 'gradient' ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-900/30'}
                      `}
                      >
                        {icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h3
                          className={`
                          text-lg font-semibold tracking-tight
                          ${variant === 'gradient' ? 'text-inherit' : 'text-slate-900 dark:text-white'}
                        `}
                        >
                          {title}
                        </h3>
                      )}
                      {description && (
                        <p
                          className={`
                          mt-1 text-sm
                          ${variant === 'gradient' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}
                        `}
                        >
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
                </div>
              </div>
            )}

            {/* Content */}
            <div className={`${title || description ? (noPadding ? '' : 'px-6 pb-6') : (noPadding ? '' : 'p-6')}`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className={`
                px-6 py-4 border-t
                ${variant === 'gradient'
                    ? 'border-white/20 bg-black/10'
                    : 'border-slate-100 dark:border-surface-700 bg-slate-50/50 dark:bg-surface-800/50'
                  }
              `}
              >
                {footer}
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

// Card Header component
export const CardHeader = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`px-6 pt-6 pb-3 ${className}`}>{children}</div>
);

// Card Content component
export const CardContent = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

// Card Footer component
export const CardFooter = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`px-6 py-4 border-t border-slate-100 dark:border-surface-700 bg-slate-50/50 dark:bg-surface-800/50 ${className}`}
  >
    {children}
  </div>
);
=======
import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  isLoading?: boolean;
}

const Card = ({
  children,
  className = '',
  title,
  description,
  footer,
  isLoading = false,
}: CardProps) => {
  return (
    <div
      className={`bg-white rounded-card shadow-card overflow-hidden transition-shadow duration-200 hover:shadow-card-hover ${className}`}
    >
      {isLoading ? (
        <div className="p-6 animate-pulse">
          {title && <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />}
          {description && <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      ) : (
        <>
          {(title || description) && (
            <div className="px-6 pt-6 pb-3">
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          )}
          <div className={`${title || description ? 'px-6 pb-6' : 'p-6'}`}>{children}</div>
          {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
        </>
      )}
    </div>
  );
};

export default Card;
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
