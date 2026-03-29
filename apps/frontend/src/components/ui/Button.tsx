import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gold';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium transition-colors duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      select-none
    `;

    const variantStyles: Record<ButtonVariant, string> = {
      primary: `
        bg-primary-600 hover:bg-primary-700
        text-white shadow-sm
        focus-visible:ring-primary-500
      `,
      secondary: `
        bg-slate-100 hover:bg-slate-200
        text-slate-700 hover:text-slate-900
        dark:bg-surface-700 dark:hover:bg-surface-600
        dark:text-slate-200 dark:hover:text-white
        focus-visible:ring-slate-500
      `,
      outline: `
        bg-transparent border-2 border-primary-500
        text-primary-600 hover:bg-primary-500 hover:text-white
        dark:border-primary-400 dark:text-primary-400
        dark:hover:bg-primary-500 dark:hover:text-white
        focus-visible:ring-primary-500
      `,
      ghost: `
        bg-transparent hover:bg-slate-100
        text-slate-600 hover:text-slate-900
        dark:hover:bg-surface-700
        dark:text-slate-400 dark:hover:text-white
        focus-visible:ring-slate-500
      `,
      danger: `
        bg-error-600 hover:bg-error-700
        text-white shadow-sm
        focus-visible:ring-error-500
      `,
      success: `
        bg-success-600 hover:bg-success-700
        text-white shadow-sm
        focus-visible:ring-success-500
      `,
      gold: `
        bg-gold-500 hover:bg-gold-600
        text-slate-900 shadow-sm
        focus-visible:ring-gold-500
      `,
    };

    const sizeStyles: Record<ButtonSize, string> = {
      xs: iconOnly ? 'p-1.5' : 'text-xs px-2.5 py-1.5 rounded-md',
      sm: iconOnly ? 'p-2' : 'text-sm px-3 py-2 rounded-lg',
      md: iconOnly ? 'p-2.5' : 'text-sm px-4 py-2.5 rounded-lg',
      lg: iconOnly ? 'p-3' : 'text-base px-5 py-3 rounded-xl',
      xl: iconOnly ? 'p-4' : 'text-lg px-6 py-4 rounded-xl',
    };

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
      <button
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
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'iconOnly'>>(
  (props, ref) => <Button ref={ref} {...props} iconOnly />
);

IconButton.displayName = 'IconButton';
