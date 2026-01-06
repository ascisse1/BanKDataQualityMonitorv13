import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled' | 'flushed';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  successMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  inputSize?: InputSize;
  variant?: InputVariant;
  isRequired?: boolean;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      successMessage,
      leftIcon,
      rightIcon,
      fullWidth = false,
      inputSize = 'md',
      variant = 'default',
      isRequired = false,
      showPasswordToggle = false,
      className = '',
      id,
      type,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine input type
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Size styles
    const sizeStyles: Record<InputSize, string> = {
      sm: 'text-sm py-1.5 px-3',
      md: 'text-sm py-2.5 px-4',
      lg: 'text-base py-3 px-4',
    };

    // Icon size styles
    const iconSizeStyles: Record<InputSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    // Variant styles
    const variantStyles: Record<InputVariant, string> = {
      default: `
        bg-white dark:bg-surface-900
        border border-slate-200 dark:border-surface-600
        rounded-lg
        focus:border-primary-500 dark:focus:border-primary-400
        focus:ring-2 focus:ring-primary-500/20
      `,
      filled: `
        bg-slate-100 dark:bg-surface-800
        border border-transparent
        rounded-lg
        focus:bg-white dark:focus:bg-surface-900
        focus:border-primary-500 dark:focus:border-primary-400
        focus:ring-2 focus:ring-primary-500/20
      `,
      flushed: `
        bg-transparent
        border-0 border-b-2 border-slate-200 dark:border-surface-600
        rounded-none px-0
        focus:border-primary-500 dark:focus:border-primary-400
        focus:ring-0
      `,
    };

    // State styles
    const stateStyles = error
      ? 'border-error-500 dark:border-error-400 focus:border-error-500 focus:ring-error-500/20'
      : successMessage
        ? 'border-success-500 dark:border-success-400 focus:border-success-500 focus:ring-success-500/20'
        : '';

    // Handle focus/blur
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <motion.div
        className={`${fullWidth ? 'w-full' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Label */}
        {label && (
          <motion.label
            htmlFor={inputId}
            className={`
              block text-sm font-medium mb-1.5
              transition-colors duration-200
              ${isFocused ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}
              ${error ? 'text-error-600 dark:text-error-400' : ''}
              ${disabled ? 'opacity-50' : ''}
            `}
            animate={{ color: isFocused ? 'var(--color-primary)' : undefined }}
          >
            {label}
            {isRequired && <span className="text-error-500 ml-0.5">*</span>}
          </motion.label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={`
                absolute inset-y-0 left-0 flex items-center pointer-events-none
                ${variant === 'flushed' ? 'pl-0' : 'pl-3'}
              `}
            >
              <span
                className={`
                  ${iconSizeStyles[inputSize]}
                  transition-colors duration-200
                  ${isFocused ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'}
                  ${error ? 'text-error-500' : ''}
                `}
              >
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              block w-full
              ${sizeStyles[inputSize]}
              ${variantStyles[variant]}
              ${stateStyles}
              ${leftIcon ? (variant === 'flushed' ? 'pl-7' : 'pl-10') : ''}
              ${rightIcon || (type === 'password' && showPasswordToggle) ? 'pr-10' : ''}
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-surface-800
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right icon / Password toggle / Status icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
            {/* Status icons */}
            <AnimatePresence>
              {error && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-error-500"
                >
                  <AlertCircle className={iconSizeStyles[inputSize]} />
                </motion.span>
              )}
              {successMessage && !error && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-success-500"
                >
                  <CheckCircle2 className={iconSizeStyles[inputSize]} />
                </motion.span>
              )}
            </AnimatePresence>

            {/* Password toggle */}
            {type === 'password' && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  ${iconSizeStyles[inputSize]}
                  text-slate-400 hover:text-slate-600
                  dark:text-slate-500 dark:hover:text-slate-300
                  transition-colors duration-200
                  focus:outline-none
                `}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className={iconSizeStyles[inputSize]} />
                ) : (
                  <Eye className={iconSizeStyles[inputSize]} />
                )}
              </button>
            )}

            {/* Custom right icon */}
            {rightIcon && !error && !successMessage && (
              <span
                className={`
                  ${iconSizeStyles[inputSize]}
                  text-slate-400 dark:text-slate-500
                `}
              >
                {rightIcon}
              </span>
            )}
          </div>

          {/* Focus ring animation */}
          <motion.div
            className={`
              absolute inset-0 rounded-lg pointer-events-none
              border-2 border-primary-500/0
            `}
            animate={{
              borderColor: isFocused ? 'rgba(12, 140, 233, 0.3)' : 'rgba(12, 140, 233, 0)',
            }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Helper text / Error message / Success message */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-sm text-error-500 dark:text-error-400 flex items-center gap-1"
            >
              {error}
            </motion.p>
          ) : successMessage ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-sm text-success-500 dark:text-success-400 flex items-center gap-1"
            >
              {successMessage}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={`${inputId}-helper`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 text-sm text-slate-500 dark:text-slate-400"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

// Textarea variant
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  Omit<InputProps, 'type' | 'showPasswordToggle'> & { rows?: number }
>(({ rows = 4, className = '', ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={props.fullWidth ? 'w-full' : ''}>
      {props.label && (
        <label
          className={`
            block text-sm font-medium mb-1.5
            transition-colors duration-200
            ${isFocused ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}
            ${props.error ? 'text-error-600 dark:text-error-400' : ''}
          `}
        >
          {props.label}
          {props.isRequired && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          block w-full
          text-sm py-2.5 px-4
          bg-white dark:bg-surface-900
          border border-slate-200 dark:border-surface-600
          rounded-lg
          focus:border-primary-500 dark:focus:border-primary-400
          focus:ring-2 focus:ring-primary-500/20
          text-slate-900 dark:text-white
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${props.error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : ''}
          ${className}
        `}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
      {props.error && (
        <p className="mt-1.5 text-sm text-error-500 dark:text-error-400">{props.error}</p>
      )}
      {props.helperText && !props.error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{props.helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
