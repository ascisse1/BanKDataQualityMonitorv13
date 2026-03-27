import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Save, Ticket, AlertCircle, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAnomalyCorrection } from '../../../hooks/useAnomalyCorrection';

interface AnomalieCorrectionProps {
  anomaly: {
    cli: string;
    field: string;
    fieldCode: string;
    currentValue: string | null;
    errorMessage: string;
  };
  onCorrectionComplete: () => void;
}

const AnomalyCorrection: React.FC<AnomalieCorrectionProps> = ({
  anomaly,
  onCorrectionComplete
}) => {
  const [newValue, setNewValue] = useState<string>(anomaly.currentValue || '');
  const [notes, setNotes] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<{
    ticketNumber?: string;
    requiresValidation?: boolean;
    message?: string;
  } | null>(null);

  const { fixAnomaly, isProcessing } = useAnomalyCorrection();

  // Reset state when anomaly changes
  useEffect(() => {
    setNewValue(anomaly.currentValue || '');
    setNotes('');
    setSubmissionResult(null);
  }, [anomaly.cli, anomaly.fieldCode]);

  const handleFixAnomaly = async () => {
    const result = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      fieldLabel: anomaly.field,
      oldValue: anomaly.currentValue,
      newValue: newValue,
      status: 'fixed',
      notes: notes || undefined,
    });

    if (result.success) {
      setSubmissionResult({
        ticketNumber: result.ticketNumber,
        requiresValidation: result.requiresValidation,
        message: result.message,
      });
      // Refresh the list immediately, close modal after brief delay
      onCorrectionComplete();
    }
  };

  const handleReviewAnomaly = async () => {
    const result = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      fieldLabel: anomaly.field,
      oldValue: anomaly.currentValue,
      newValue: null,
      status: 'in_review',
      notes: notes || undefined,
    });

    if (result.success) {
      setSubmissionResult({
        ticketNumber: result.ticketNumber,
        requiresValidation: true,
        message: result.message,
      });
      onCorrectionComplete();
    }
  };

  const handleRejectAnomaly = async () => {
    const result = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      fieldLabel: anomaly.field,
      oldValue: anomaly.currentValue,
      newValue: null,
      status: 'rejected',
      notes: notes || undefined,
    });

    if (result.success) {
      setSubmissionResult({
        ticketNumber: result.ticketNumber,
        requiresValidation: false,
        message: result.message,
      });
      onCorrectionComplete();
    }
  };

  // Show success state after submission
  if (submissionResult) {
    const allCorrected = submissionResult.requiresValidation;

    return (
      <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="text-center py-4">
          <CheckCircle className={`h-12 w-12 mx-auto mb-3 ${allCorrected ? 'text-success-500' : 'text-primary-500'}`} />
          <h3 className="text-lg font-medium text-gray-900">
            {allCorrected ? 'Toutes les corrections soumises' : 'Correction enregistrée'}
          </h3>

          {submissionResult.ticketNumber && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
              <Ticket className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                Ticket: {submissionResult.ticketNumber}
              </span>
            </div>
          )}

          {allCorrected ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-warning-600">
              <Users className="h-4 w-4" />
              <span>En attente de validation superviseur (4 Eyes)</span>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
              <AlertCircle className="h-4 w-4" />
              <span>D'autres champs restent à corriger pour ce client</span>
            </div>
          )}

          <p className="mt-3 text-sm text-gray-500">
            {submissionResult.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Correction de l'anomalie</h3>
        <p className="mt-1 text-sm text-gray-500">
          {anomaly.errorMessage}
        </p>
      </div>

      {/* 4 Eyes Workflow Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-800">Workflow 4 Yeux</p>
          <p className="text-blue-600">
            Cette correction créera un ticket qui devra être validé par un superviseur
            avant d'être appliquée au système bancaire (CBS).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Valeur actuelle"
            value={anomaly.currentValue || '<vide>'}
            disabled
          />
        </div>

        <div>
          <Input
            label="Nouvelle valeur"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Entrez la nouvelle valeur"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajoutez des notes sur cette correction (justification, source des données, etc.)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<XCircle className="h-4 w-4" />}
          onClick={handleRejectAnomaly}
          disabled={isProcessing}
          className="text-error-600 hover:text-error-700 hover:border-error-300"
        >
          Rejeter l'anomalie
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Clock className="h-4 w-4" />}
          onClick={handleReviewAnomaly}
          disabled={isProcessing}
        >
          Mettre en revue
        </Button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save className="h-4 w-4" />}
          onClick={handleFixAnomaly}
          disabled={isProcessing || !newValue}
          isLoading={isProcessing}
        >
          Soumettre la correction
        </Button>
      </div>
    </div>
  );
};

export default AnomalyCorrection;