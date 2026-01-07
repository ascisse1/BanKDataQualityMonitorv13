<<<<<<< HEAD
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gold';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
  rounded?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      iconOnly = false,
      rounded = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = `
      relative inline-flex items-center justify-center gap-2
      font-medium transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      overflow-hidden select-none
    `;

    // Variant styles with gradients and hover effects
    const variantStyles: Record<ButtonVariant, string> = {
      primary: `
        bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700
        hover:from-primary-600 hover:via-primary-700 hover:to-primary-800
        text-white shadow-md hover:shadow-lg hover:shadow-primary-500/25
        focus-visible:ring-primary-500
        active:scale-[0.98]
      `,
      secondary: `
        bg-slate-100 hover:bg-slate-200
        text-slate-700 hover:text-slate-900
        dark:bg-surface-700 dark:hover:bg-surface-600
        dark:text-slate-200 dark:hover:text-white
        focus-visible:ring-slate-500
        active:scale-[0.98]
      `,
      outline: `
        bg-transparent border-2 border-primary-500
        text-primary-600 hover:bg-primary-500 hover:text-white
        dark:border-primary-400 dark:text-primary-400
        dark:hover:bg-primary-500 dark:hover:text-white
        focus-visible:ring-primary-500
        active:scale-[0.98]
      `,
      ghost: `
        bg-transparent hover:bg-slate-100
        text-slate-600 hover:text-slate-900
        dark:hover:bg-surface-700
        dark:text-slate-400 dark:hover:text-white
        focus-visible:ring-slate-500
        active:scale-[0.98]
      `,
      danger: `
        bg-gradient-to-r from-error-500 via-error-600 to-error-700
        hover:from-error-600 hover:via-error-700 hover:to-error-800
        text-white shadow-md hover:shadow-lg hover:shadow-error-500/25
        focus-visible:ring-error-500
        active:scale-[0.98]
      `,
      success: `
        bg-gradient-to-r from-success-500 via-success-600 to-success-700
        hover:from-success-600 hover:via-success-700 hover:to-success-800
        text-white shadow-md hover:shadow-lg hover:shadow-success-500/25
        focus-visible:ring-success-500
        active:scale-[0.98]
      `,
      gold: `
        bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600
        hover:from-gold-500 hover:via-gold-600 hover:to-gold-700
        text-slate-900 shadow-md hover:shadow-lg hover:shadow-gold-500/25
        focus-visible:ring-gold-500
        active:scale-[0.98]
      `,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      xs: iconOnly ? 'p-1.5' : 'text-xs px-2.5 py-1.5 rounded-md',
      sm: iconOnly ? 'p-2' : 'text-sm px-3 py-2 rounded-lg',
      md: iconOnly ? 'p-2.5' : 'text-sm px-4 py-2.5 rounded-lg',
      lg: iconOnly ? 'p-3' : 'text-base px-5 py-3 rounded-xl',
      xl: iconOnly ? 'p-4' : 'text-lg px-6 py-4 rounded-xl',
    };

    // Loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <motion.button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${rounded ? 'rounded-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        whileHover={{ y: disabled || isLoading ? 0 : -2 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {/* Ripple effect overlay */}
        <span className="absolute inset-0 overflow-hidden rounded-inherit">
          <span className="ripple-effect" />
        </span>

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Icon Button variant
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'iconOnly'>>(
  (props, ref) => <Button ref={ref} {...props} iconOnly />
);

IconButton.displayName = 'IconButton';
=======
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  // Styles based on variant
  const variantStyles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-gray-900',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    danger: 'bg-error-500 hover:bg-error-600 text-white',
  };

  // Styles based on size
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-base px-6 py-3 rounded-md',
  };

  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
