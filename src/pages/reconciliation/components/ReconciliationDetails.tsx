import { X, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ReconciliationTask, reconciliationService } from '../../../services/reconciliationService';
import Button from '../../../components/ui/Button';

interface ReconciliationDetailsProps {
  task: ReconciliationTask;
  onClose: () => void;
  onRetry: (taskId: string) => void;
}

export const ReconciliationDetails = ({ task, onClose, onRetry }: ReconciliationDetailsProps) => {
  const matchedFields = task.corrections.filter((c) => c.is_matched).length;
  const totalFields = task.corrections.length;
  const matchPercentage = reconciliationService.calculateMatchPercentage(matchedFields, totalFields);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de la réconciliation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ticket #{task.ticket_id} - Client: {task.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${reconciliationService.getStatusColor(
                    task.status
                  )}`}
                >
                  {reconciliationService.getStatusLabel(task.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taux de correspondance</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {matchPercentage}% ({matchedFields}/{totalFields})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tentatives</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{task.attempts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Créé le</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {new Date(task.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              {task.reconciled_at && (
                <div>
                  <p className="text-sm text-gray-600">Réconcilié le</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(task.reconciled_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
              {task.last_attempt_at && (
                <div>
                  <p className="text-sm text-gray-600">Dernière tentative</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(task.last_attempt_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            {task.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Erreur:</span> {task.error_message}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Comparaison des champs
            </h3>
            <div className="space-y-2">
              {task.corrections.map((correction, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    correction.is_matched
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {correction.is_matched ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <p className="font-medium text-gray-900">
                          {correction.field_label}
                        </p>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Valeur attendue</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">
                            {correction.expected_value}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Valeur CBS</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">
                            {correction.cbs_value || (
                              <span className="text-gray-400 italic">Non disponible</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {correction.last_checked_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Vérifié le:{' '}
                          {new Date(correction.last_checked_at).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          {(task.status === 'failed' || task.status === 'partial') && (
            <Button onClick={() => onRetry(task.id)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
