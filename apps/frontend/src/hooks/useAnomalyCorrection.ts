import { useState } from 'react';
import { useToast } from '../components/ui/Toaster';
import { useAuth } from '../context/AuthContext';
import { log } from '../services/log';
import { correctionService, CorrectionAction, CorrectionResponse, RejectionReason } from '../services/correctionService';

interface AnomalyData {
  cli: string;
  field: string;
  fieldLabel?: string;
  oldValue: string | null;
  newValue: string | null;
  status: 'fixed' | 'in_review' | 'rejected';
  notes?: string;
  rejectionReason?: RejectionReason;
}

interface CorrectionResult {
  success: boolean;
  ticketNumber?: string;
  ticketId?: number;
  requiresValidation?: boolean;
  message?: string;
}

export const useAnomalyCorrection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<CorrectionResponse | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  /**
   * Submit a correction for an anomaly.
   * Creates a ticket and starts the 4 Eyes validation workflow.
   */
  const fixAnomaly = async (anomalyData: AnomalyData): Promise<CorrectionResult> => {
    if (!user) {
      addToast('Vous devez être connecté pour effectuer cette action', 'error');
      return { success: false, message: 'Non authentifié' };
    }

    try {
      setIsProcessing(true);
      log.info('business', `Processing anomaly for client ${anomalyData.cli}`, {
        field: anomalyData.field,
        oldValue: anomalyData.oldValue,
        newValue: anomalyData.newValue,
        status: anomalyData.status
      });

      // Map status to CorrectionAction
      const action: CorrectionAction = anomalyData.status === 'fixed'
        ? 'FIX'
        : anomalyData.status === 'in_review'
          ? 'REVIEW'
          : 'REJECT';

      // Call the backend API
      const response = await correctionService.submitCorrection({
        cli: anomalyData.cli,
        fieldName: anomalyData.field,
        fieldLabel: anomalyData.fieldLabel,
        oldValue: anomalyData.oldValue,
        newValue: anomalyData.newValue,
        structureCode: user.structureCodes?.[0] || 'HQ',
        notes: anomalyData.notes,
        action,
        priority: 'MEDIUM',
        rejectionReason: anomalyData.rejectionReason,
      });

      setLastCorrection(response);

      // Log the successful correction
      log.info('user', `Anomaly ${anomalyData.status} for client ${anomalyData.cli}`, {
        field: anomalyData.field,
        by: user.username,
        agency: user.structureCodes?.[0] || 'N/A',
        ticketNumber: response.ticketNumber,
      });

      // Show success toast from backend message
      addToast(response.message, 'success');

      return {
        success: true,
        ticketNumber: response.ticketNumber,
        ticketId: response.ticketId,
        requiresValidation: response.requiresValidation,
        message: response.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      log.error('business', `Failed to fix anomaly for client ${anomalyData.cli}`, {
        error: errorMessage,
        field: anomalyData.field
      });

      log.error('api', `Failed to fix anomaly for client ${anomalyData.cli}`, {
        error: errorMessage,
        field: anomalyData.field
      });

      addToast(`Erreur lors du traitement de l'anomalie: ${errorMessage}`, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get corrections history for a client
   */
  const getClientCorrections = async (cli: string) => {
    try {
      return await correctionService.getClientCorrections(cli);
    } catch (error) {
      log.error('api', `Failed to get corrections for client ${cli}`, { error });
      return [];
    }
  };

  /**
   * Get pending validations (for supervisors)
   */
  const getPendingValidations = async () => {
    try {
      return await correctionService.getPendingValidation();
    } catch (error) {
      log.error('api', 'Failed to get pending validations', { error });
      return [];
    }
  };

  /**
   * Validate a correction (4 Eyes approval/rejection)
   */
  const validateCorrection = async (ticketId: number, approved: boolean, reason?: string) => {
    if (!user) {
      addToast('Vous devez être connecté pour valider', 'error');
      return { success: false };
    }

    try {
      setIsProcessing(true);
      const response = await correctionService.validateCorrection(ticketId, approved, reason);

      addToast(
        approved
          ? `Correction validée (Ticket: ${response.ticketNumber})`
          : `Correction rejetée (Ticket: ${response.ticketNumber})`,
        'success'
      );

      return { success: true, response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de validation';
      addToast(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    fixAnomaly,
    getClientCorrections,
    getPendingValidations,
    validateCorrection,
    isProcessing,
    lastCorrection,
  };
};