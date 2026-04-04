import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'warning',
  isLoading = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onCancel, isLoading]);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const iconMap = {
    danger: <XCircle className="h-6 w-6 text-error-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning-500" />,
    info: <Info className="h-6 w-6 text-primary-500" />,
  };

  const iconBgMap = {
    danger: 'bg-error-100 dark:bg-error-900/30',
    warning: 'bg-warning-100 dark:bg-warning-900/30',
    info: 'bg-primary-100 dark:bg-primary-900/30',
  };

  const confirmVariantMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in"
      >
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 p-2 rounded-full ${iconBgMap[variant]}`}>
            {iconMap[variant]}
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p id="confirm-dialog-description" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            ref={cancelRef}
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariantMap[variant]}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

// ── useConfirmDialog hook ──────────────────────────────────────────

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

/**
 * Hook that returns an imperative `confirm(message)` function (returns Promise<boolean>)
 * and a `ConfirmDialogPortal` component that must be rendered in the component tree.
 *
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialogPortal } = useConfirmDialog();
 * // ...
 * const ok = await confirm('Are you sure?');
 * // ...
 * return <>{/* ... *\/}<ConfirmDialogPortal /></>;
 * ```
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    resolve: null,
  });

  const confirm = useCallback(
    (messageOrOptions: string | ConfirmOptions): Promise<boolean> => {
      const opts: ConfirmOptions =
        typeof messageOrOptions === 'string'
          ? { message: messageOrOptions }
          : messageOrOptions;

      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          resolve,
          title: opts.title ?? 'Confirmation',
          message: opts.message,
          confirmLabel: opts.confirmLabel,
          cancelLabel: opts.cancelLabel,
          variant: opts.variant ?? 'warning',
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const ConfirmDialogPortal: React.FC = useCallback(
    () =>
      createPortal(
        <ConfirmDialog
          open={state.open}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title={state.title ?? 'Confirmation'}
          description={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          variant={state.variant}
        />,
        document.body
      ),
    [state.open, state.title, state.message, state.confirmLabel, state.cancelLabel, state.variant, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmDialogPortal };
}
