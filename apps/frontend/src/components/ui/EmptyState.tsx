import { type ReactNode } from 'react';
import {
  FileQuestion,
  Search,
  FolderOpen,
  Inbox,
  AlertCircle,
  WifiOff,
  ServerCrash,
  RefreshCw,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import Button from './Button';

type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'no-files'
  | 'empty-inbox'
  | 'error'
  | 'offline'
  | 'server-error';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string; description: string; color: string }
> = {
  'no-data': {
    icon: Inbox,
    title: 'Aucune donnée',
    description: 'Il n\'y a pas encore de données à afficher.',
    color: 'text-slate-400',
  },
  'no-results': {
    icon: Search,
    title: 'Aucun résultat',
    description: 'Essayez de modifier vos critères de recherche.',
    color: 'text-primary-400',
  },
  'no-files': {
    icon: FolderOpen,
    title: 'Aucun fichier',
    description: 'Commencez par télécharger un fichier.',
    color: 'text-gold-400',
  },
  'empty-inbox': {
    icon: FileQuestion,
    title: 'Boîte vide',
    description: 'Vous n\'avez pas de nouveaux éléments.',
    color: 'text-accent-400',
  },
  'error': {
    icon: AlertCircle,
    title: 'Une erreur est survenue',
    description: 'Veuillez réessayer ou contacter le support.',
    color: 'text-error-400',
  },
  'offline': {
    icon: WifiOff,
    title: 'Hors connexion',
    description: 'Vérifiez votre connexion internet.',
    color: 'text-warning-400',
  },
  'server-error': {
    icon: ServerCrash,
    title: 'Erreur serveur',
    description: 'Le serveur ne répond pas. Veuillez réessayer plus tard.',
    color: 'text-error-400',
  },
};

const EmptyState = ({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) => {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-6">
        {icon || <IconComponent className={`w-10 h-10 ${config.color}`} strokeWidth={1.5} />}
      </div>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">
        {title || config.title}
      </h3>

      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
        {description || config.description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              leftIcon={variant === 'error' || variant === 'server-error' ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-950 p-4">
    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-error-500" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Une erreur est survenue
      </h2>

      <p className="text-slate-500 dark:text-slate-400 mb-4">
        Veuillez réessayer.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <pre className="text-left text-xs text-error-600 bg-error-50 dark:bg-error-900/20 p-3 rounded-lg mb-4 overflow-auto max-h-32">
          {error.message}
        </pre>
      )}

      <Button onClick={resetErrorBoundary} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Réessayer
      </Button>
    </div>
  </div>
);

export const LoadingState = ({
  message = 'Chargement...',
  className = '',
}: {
  message?: string;
  className?: string;
}) => (
  <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 border-4 border-slate-200 dark:border-surface-700 rounded-full" />
      <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin" />
    </div>
    <p className="text-slate-500 dark:text-slate-400">{message}</p>
  </div>
);
