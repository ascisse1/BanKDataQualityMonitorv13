import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { apiService } from '../../../services/apiService';
import { log } from '../../../services/log';

interface BackendAnomaly {
  id: number;
  clientNumber: string;
  clientName: string;
  clientType: string;
  fieldName: string;
  fieldLabel: string;
  errorType: string;
  errorMessage: string;
  structureCode: string;
  structureName: string;
  status: string;
  createdAt: string;
}

interface Anomaly {
  id: string;
  clientId: string;
  clientName: string;
  clientType: 'Individual' | 'Corporate';
  field: string;
  errorType: string;
  branch: string;
  createdAt: string;
  status: 'New' | 'Reviewing' | 'Resolved';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface RecentAnomaliesProps {
  isLoading?: boolean;
}

const mapClientType = (type: string): 'Individual' | 'Corporate' => {
  switch (type) {
    case 'INDIVIDUAL':
      return 'Individual';
    case 'CORPORATE':
    case 'INSTITUTIONAL':
      return 'Corporate';
    default:
      return 'Individual';
  }
};

const mapStatus = (status: string): 'New' | 'Reviewing' | 'Resolved' => {
  switch (status) {
    case 'PENDING':
      return 'New';
    case 'IN_PROGRESS':
    case 'CORRECTED':
      return 'Reviewing';
    case 'VALIDATED':
    case 'CLOSED':
      return 'Resolved';
    case 'REJECTED':
      return 'New';
    default:
      return 'New';
  }
};

const RecentAnomalies = ({ isLoading: externalLoading = false }: RecentAnomaliesProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentAnomalies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiService.get<ApiResponse<BackendAnomaly[]>>('/stats/recent-anomalies?limit=10');

        log.debug('api', 'Recent anomalies response', { response });

        if (response.success && response.data && Array.isArray(response.data)) {
          const mapped: Anomaly[] = response.data.map((a) => ({
            id: String(a.id),
            clientId: a.clientNumber || '',
            clientName: a.clientName || 'Client inconnu',
            clientType: mapClientType(a.clientType),
            field: a.fieldLabel || a.fieldName || '',
            errorType: a.errorMessage || a.errorType || 'Erreur',
            branch: a.structureCode || '',
            createdAt: a.createdAt,
            status: mapStatus(a.status),
          }));
          setAnomalies(mapped);
        }
      } catch (err) {
        log.error('api', 'Failed to fetch recent anomalies', { error: err });
        setError('Impossible de charger les anomalies récentes');
      } finally {
        setIsLoading(false);
      }
    };

    if (!externalLoading) {
      fetchRecentAnomalies();
    }
  }, [externalLoading]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-warning-100 text-warning-800';
      case 'Reviewing':
        return 'bg-primary-100 text-primary-800';
      case 'Resolved':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || externalLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-24 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Champ
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type d'erreur
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Agence
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Détecté le
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {anomalies.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">Aucune anomalie récente</p>
                  <p className="text-sm">Les anomalies détectées apparaîtront ici</p>
                </div>
              </td>
            </tr>
          ) : (
            anomalies.map((anomaly) => (
              <tr key={anomaly.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {anomaly.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{anomaly.clientName}</div>
                      <div className="text-xs text-gray-500">{anomaly.clientId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{anomaly.field}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />
                    {anomaly.errorType}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {anomaly.branch}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(anomaly.createdAt)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      anomaly.status
                    )}`}
                  >
                    {anomaly.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecentAnomalies;
