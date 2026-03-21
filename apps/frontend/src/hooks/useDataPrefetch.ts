import { useEffect } from 'react';
import { db } from '../services/db';
import { logger } from '../services/logger';

/**
 * Hook pour précharger les données critiques en arrière-plan
 */
export const useDataPrefetch = () => {
  useEffect(() => {
    const prefetchData = async () => {
      // Skip prefetch in production to improve initial load time
      if (import.meta.env.PROD) {
        return;
      }
      
      try {
        // Préchargement intelligent basé sur l'usage
        const prefetchPromises = [
          // Données du dashboard (priorité haute)
          db.getClientStats(),
          db.getValidationMetrics(),
          
          // Données par agence (priorité basse)
          db.getAnomaliesByBranch()
        ];

        // Exécution séquentielle pour éviter la surcharge
        for (const promise of prefetchPromises) {
          await promise.catch(error => 
            logger.warning('prefetch', 'Prefetch failed for promise', { error })
          );
          
          // Pause entre les requêtes pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        logger.info('prefetch', 'Data prefetch completed successfully');
      } catch (error) {
        logger.error('prefetch', 'Data prefetch failed', { error });
      }
    };

    // Démarrer le préchargement après un délai
    const timer = setTimeout(prefetchData, 2000);
    
    return () => clearTimeout(timer);
  }, []);
};