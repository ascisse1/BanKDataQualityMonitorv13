import { useState, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';

interface FetchOptions {
  showLoadingOverlay?: boolean;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useDataFetching() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification, setIsLoading: setGlobalLoading } = useNotification();

  const fetchData = useCallback(async <T>(
    fetchFunction: () => Promise<T>,
    options: FetchOptions = {}
  ): Promise<T | null> => {
    const {
      showLoadingOverlay = false,
      showSuccessNotification = true,
      showErrorNotification = true,
      loadingMessage = 'Chargement des données en cours...',
      successMessage = 'Données chargées avec succès',
      errorMessage = 'Erreur lors du chargement des données'
    } = options;

    try {
      setIsLoading(true);
      setError(null);
      
      if (showLoadingOverlay) {
        setGlobalLoading(true);
      } else {
        showNotification(loadingMessage, 'loading');
      }

      const result = await fetchFunction();

      if (showSuccessNotification) {
        showNotification(successMessage, 'success');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      
      if (showErrorNotification) {
        showNotification(`${errorMessage}: ${message}`, 'error');
      }
      
      return null;
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  }, [showNotification, setGlobalLoading]);

  return { fetchData, isLoading, error };
}