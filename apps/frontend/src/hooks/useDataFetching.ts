import { useState, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useToast } from '../components/ui/Toaster';

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
  const { setIsLoading: setGlobalLoading } = useNotification();
  const { addToast } = useToast();

  const fetchData = useCallback(async <T>(
    fetchFunction: () => Promise<T>,
    options: FetchOptions = {}
  ): Promise<T | null> => {
    const {
      showLoadingOverlay = false,
      showSuccessNotification = true,
      showErrorNotification = true,
      successMessage = 'Données chargées avec succès',
      errorMessage = 'Erreur lors du chargement des données'
    } = options;

    try {
      setIsLoading(true);
      setError(null);

      if (showLoadingOverlay) {
        setGlobalLoading(true);
      }

      const result = await fetchFunction();

      if (showSuccessNotification) {
        addToast(successMessage, 'success');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);

      if (showErrorNotification) {
        addToast(`${errorMessage}: ${message}`, 'error');
      }

      return null;
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  }, [addToast, setGlobalLoading]);

  return { fetchData, isLoading, error };
}
