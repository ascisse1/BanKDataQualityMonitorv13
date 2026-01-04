import { Eye, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ReconciliationTask, reconciliationService } from '../../../services/reconciliationService';
import Button from '../../../components/ui/Button';

interface ReconciliationTableProps {
  tasks: ReconciliationTask[];
  loading: boolean;
  onViewDetails: (task: ReconciliationTask) => void;
  onReconcile: (taskId: string) => void;
  onRetry: (taskId: string) => void;
}

export const ReconciliationTable = ({
  tasks,
  loading,
  onViewDetails,
  onReconcile,
  onRetry,
}: ReconciliationTableProps) => {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune réconciliation en attente
        </h3>
        <p className="text-gray-600">
          Toutes les corrections ont été réconciliées avec le CBS.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket / Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Champs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correspondance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tentatives
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => {
              const matchedFields = task.corrections.filter((c) => c.is_matched).length;
              const totalFields = task.corrections.length;
              const matchPercentage = reconciliationService.calculateMatchPercentage(
                matchedFields,
                totalFields
              );

              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{task.ticket_id}
                    </div>
                    <div className="text-sm text-gray-500">{task.client_name}</div>
                    <div className="text-xs text-gray-400">ID: {task.client_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reconciliationService.getStatusColor(
                        task.status
                      )}`}
                    >
                      {reconciliationService.getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totalFields} champ{totalFields > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              matchPercentage === 100
                                ? 'bg-green-500'
                                : matchPercentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${matchPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {matchPercentage}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {matchedFields}/{totalFields} correspondances
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{task.attempts}</div>
                    {task.last_attempt_at && (
                      <div className="text-xs text-gray-500">
                        Dernier: {new Date(task.last_attempt_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewDetails(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => onReconcile(task.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Réconcilier
                        </Button>
                      )}
                      {(task.status === 'failed' || task.status === 'partial') && (
                        <Button
                          size="sm"
                          onClick={() => onRetry(task.id)}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Réessayer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
