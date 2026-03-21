import { useState, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';

/**
 * A custom hook for handling data loading states and notifications
 */
export const useDataLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification, showLoading, hideLoading } = useNotification();

  const startLoading = useCallback((message?: string) => {
    setIsLoading(true);
    if (message) {
      showLoading(message);
    }
  }, [showLoading]);

  const stopLoading = useCallback((success: boolean, message?: string) => {
    setIsLoading(false);
    hideLoading();
    if (message) {
      showNotification(message, success ? 'success' : 'error');
    }
  }, [showNotification, hideLoading]);

  const withLoading = useCallback(async <T>(
    loadingFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | undefined> => {
    try {
      startLoading(options?.loadingMessage);
      const result = await loadingFn();
      stopLoading(true, options?.successMessage);
      return result;
    } catch (error) {
      console.error('Error during data loading:', error);
      stopLoading(false, options?.errorMessage || 'Une erreur est survenue');
      return undefined;
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  };
};