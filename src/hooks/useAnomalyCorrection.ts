import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { logger } from '../services/logger';
import { tracer } from '../services/tracer';

interface AnomalyData {
  cli: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  status: 'fixed' | 'in_review' | 'rejected';
}

export const useAnomalyCorrection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const fixAnomaly = async (anomalyData: AnomalyData) => {
    if (!user) {
      showNotification('Vous devez être connecté pour effectuer cette action', 'error');
      return false;
    }

    try {
      setIsProcessing(true);
      showNotification('Traitement de l\'anomalie en cours...', 'loading');
      
      tracer.info('business', `Fixing anomaly for client ${anomalyData.cli}`, { 
        field: anomalyData.field,
        oldValue: anomalyData.oldValue,
        newValue: anomalyData.newValue,
        status: anomalyData.status
      });
      
      // In demo mode, we'll simulate a successful update
      // Wait a bit to simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Log the successful correction
      logger.info('user', `Anomaly ${anomalyData.status} for client ${anomalyData.cli}`, {
        field: anomalyData.field,
        by: user.username,
        agency: user.agencyCode || 'N/A'
      });
      
      showNotification(
        anomalyData.status === 'fixed' 
          ? 'Anomalie corrigée avec succès' 
          : anomalyData.status === 'in_review'
            ? 'Anomalie mise en revue'
            : 'Anomalie rejetée',
        'success'
      );
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      tracer.error('business', `Failed to fix anomaly for client ${anomalyData.cli}`, { 
        error: errorMessage,
        field: anomalyData.field
      });
      
      logger.error('api', `Failed to fix anomaly for client ${anomalyData.cli}`, {
        error: errorMessage,
        field: anomalyData.field
      });
      
      showNotification(`Erreur lors du traitement de l'anomalie: ${errorMessage}`, 'error');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    fixAnomaly,
    isProcessing
  };
};