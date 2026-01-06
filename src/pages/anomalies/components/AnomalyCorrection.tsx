import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Save } from 'lucide-react';
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
  const { fixAnomaly, isProcessing } = useAnomalyCorrection();

  const handleFixAnomaly = async () => {
    const success = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      oldValue: anomaly.currentValue,
      newValue: newValue,
      status: 'fixed'
    });
    
    if (success) {
      onCorrectionComplete();
    }
  };

  const handleReviewAnomaly = async () => {
    const success = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      oldValue: anomaly.currentValue,
      newValue: null,
      status: 'in_review'
    });
    
    if (success) {
      onCorrectionComplete();
    }
  };

  const handleRejectAnomaly = async () => {
    const success = await fixAnomaly({
      cli: anomaly.cli,
      field: anomaly.fieldCode,
      oldValue: anomaly.currentValue,
      newValue: null,
      status: 'rejected'
    });
    
    if (success) {
      onCorrectionComplete();
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Correction de l'anomalie</h3>
        <p className="mt-1 text-sm text-gray-500">
          {anomaly.errorMessage}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Valeur actuelle"
            value={anomaly.currentValue || ''}
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
        <Input
          label="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajoutez des notes sur cette correction"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<XCircle className="h-4 w-4" />}
          onClick={handleRejectAnomaly}
          disabled={isProcessing}
          className="text-error-600 hover:text-error-700"
        >
          Rejeter
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
          Corriger
        </Button>
      </div>
    </div>
  );
};

export default AnomalyCorrection;