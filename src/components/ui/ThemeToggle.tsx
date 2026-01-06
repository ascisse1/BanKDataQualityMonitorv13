import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'switch' | 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle = ({
  variant = 'switch',
  size = 'md',
  showLabel = false,
  className = '',
}: ThemeToggleProps) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  // Size configurations
  const sizeConfig = {
    sm: {
      switch: 'w-12 h-6',
      knob: 'w-5 h-5',
      icon: 'w-3 h-3',
      button: 'p-1.5',
    },
    md: {
      switch: 'w-14 h-7',
      knob: 'w-6 h-6',
      icon: 'w-4 h-4',
      button: 'p-2',
    },
    lg: {
      switch: 'w-16 h-8',
      knob: 'w-7 h-7',
      icon: 'w-5 h-5',
      button: 'p-2.5',
    },
  };

  // Switch variant
  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {resolvedTheme === 'dark' ? 'Mode sombre' : 'Mode clair'}
          </span>
        )}
        <button
          onClick={toggleTheme}
          className={`
            relative ${sizeConfig[size].switch} rounded-full
            bg-slate-200 dark:bg-surface-700
            transition-colors duration-300
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          `}
          role="switch"
          aria-checked={resolvedTheme === 'dark'}
          aria-label="Toggle theme"
        >
          {/* Background icons */}
          <div className="absolute inset-0 flex items-center justify-between px-1.5">
            <Sun className={`${sizeConfig[size].icon} text-gold-500 transition-opacity ${resolvedTheme === 'dark' ? 'opacity-30' : 'opacity-100'}`} />
            <Moon className={`${sizeConfig[size].icon} text-primary-400 transition-opacity ${resolvedTheme === 'dark' ? 'opacity-100' : 'opacity-30'}`} />
          </div>

          {/* Animated knob */}
          <motion.div
            className={`
              absolute top-0.5 ${sizeConfig[size].knob} rounded-full
              bg-white shadow-md
              flex items-center justify-center
            `}
            initial={false}
            animate={{
              left: resolvedTheme === 'dark' ? 'calc(100% - 0.125rem - 1.5rem)' : '0.125rem',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: resolvedTheme === 'dark' ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className={`${sizeConfig[size].icon} text-primary-600`} />
              ) : (
                <Sun className={`${sizeConfig[size].icon} text-gold-500`} />
              )}
            </motion.div>
          </motion.div>
        </button>
      </div>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <motion.button
        onClick={toggleTheme}
        className={`
          ${sizeConfig[size].button} rounded-lg
          bg-slate-100 dark:bg-surface-700
          text-slate-600 dark:text-slate-400
          hover:bg-slate-200 dark:hover:bg-surface-600
          hover:text-slate-900 dark:hover:text-white
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <motion.div
          initial={false}
          animate={{ rotate: resolvedTheme === 'dark' ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className={sizeConfig[size].icon} />
          ) : (
            <Sun className={sizeConfig[size].icon} />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Dropdown variant (3 options: light, dark, system)
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center p-1 bg-slate-100 dark:bg-surface-700 rounded-lg">
        {[
          { value: 'light' as const, icon: Sun, label: 'Clair' },
          { value: 'dark' as const, icon: Moon, label: 'Sombre' },
          { value: 'system' as const, icon: Monitor, label: 'Système' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative ${sizeConfig[size].button} rounded-md
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
              ${theme === value
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }
            `}
            aria-label={label}
            title={label}
          >
            {theme === value && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-white dark:bg-surface-600 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className={`relative ${sizeConfig[size].icon}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;
