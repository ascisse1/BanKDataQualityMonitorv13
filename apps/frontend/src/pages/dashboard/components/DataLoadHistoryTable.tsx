import { useState, useEffect } from 'react';
import { Calendar, Database, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';
import Button from '@/components/ui/Button';
import { apiService } from '@/services/apiService';
import { log } from '@/services/log';

interface DataLoadHistoryProps {
  isLoading?: boolean;
}

interface DataLoadRecord {
  id: number;
  table_name: string;
  records_count: number;
  load_date: string;
  load_status: 'success' | 'error' | 'warning';
  error_message: string | null;
  loaded_by: string;
  execution_time_ms: number;
}

const DataLoadHistoryTable = ({ isLoading = false }: DataLoadHistoryProps) => {
  const [history, setHistory] = useState<DataLoadRecord[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      fetchHistory();
    }
  }, [isLoading]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get<{ success: boolean; data: any[] }>('/stats/data-load-history');

      if (response.success && Array.isArray(response.data)) {
        setHistory(response.data);
      } else {
        setHistory([]);
      }
    } catch (error) {
      log.error('api', 'Error fetching data load history', { error });
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success-100 text-success-800';
      case 'warning':
        return 'bg-warning-100 text-warning-800';
      case 'error':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded w-full mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-100 p-6 bg-error-50">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-error-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-error-800">{error}</h3>
            <p className="text-sm text-error-600">Veuillez réessayer ultérieurement.</p>
          </div>
          <Button
            variant="primary"
            onClick={fetchHistory}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Table
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enregistrements
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durée
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Utilisateur
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <Database className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">Aucun historique de chargement</p>
                  <p className="text-sm">Les chargements de données apparaîtront ici</p>
                </div>
              </td>
            </tr>
          ) : (
            history.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{record.table_name}</div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="text-sm text-gray-500">{formatDate(record.load_date)}</div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(record.load_status)}`}>
                    {getStatusIcon(record.load_status)}
                    <span className="ml-1">
                      {record.load_status === 'success' ? 'Succès' : 
                       record.load_status === 'warning' ? 'Avertissement' : 'Erreur'}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.records_count.toLocaleString('fr-FR')}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatExecutionTime(record.execution_time_ms)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.loaded_by}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataLoadHistoryTable;