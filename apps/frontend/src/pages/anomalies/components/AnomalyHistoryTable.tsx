import { useState, useEffect } from 'react';
import { History, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import { log } from '@/services/log';

interface AnomalyHistoryProps {
  isLoading?: boolean;
  cli?: string;
  field?: string;
}

interface AnomalyHistoryRecord {
  id: number;
  cli: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  status: 'detected' | 'in_review' | 'fixed' | 'rejected';
  structure_code: string | null;
  user_id: number;
  created_at: string;
  username: string;
  full_name: string;
}

const AnomalyHistoryTable = ({ isLoading = false, cli, field }: AnomalyHistoryProps) => {
  const [history, setHistory] = useState<AnomalyHistoryRecord[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { addToast } = useToast();
  const { user } = useAuth();
  const itemsPerPage = 20;

  // Vérifier si l'utilisateur est un utilisateur d'agence
  const isAgencyUser = user?.role === 'AGENCY_USER';
  const userStructureCode = user?.structureCodes?.[0];

  useEffect(() => {
    fetchHistory();
  }, [cli, field, currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire l'URL avec les paramètres
      let url = `/api/anomaly-history?page=${currentPage}&limit=${itemsPerPage}`;

      if (cli) {
        url += `&cli=${cli}`;
      }

      if (field) {
        url += `&field=${field}`;
      }

      // Si l'utilisateur est un utilisateur d'agence, filtrer par son agence
      if (isAgencyUser && userStructureCode) {
        url += `&structureCode=${userStructureCode}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }
      
      setHistory(data.data);
      setTotalRecords(data.total);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      log.error('api', 'Error fetching anomaly history', { error });
      setError('Erreur lors du chargement de l\'historique');
      setHistory([]);
      setTotalRecords(0);
      setTotalPages(1);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'in_review':
        return <Clock className="h-4 w-4 text-primary-500" />;
      case 'fixed':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'detected':
        return 'Détectée';
      case 'in_review':
        return 'En revue';
      case 'fixed':
        return 'Corrigée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'bg-warning-100 text-warning-800';
      case 'in_review':
        return 'bg-primary-100 text-primary-800';
      case 'fixed':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Champ
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valeur avant
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valeur après
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agence
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <History className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-lg font-medium">Aucun historique trouvé</p>
                    <p className="text-sm">Les modifications d'anomalies apparaîtront ici</p>
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm text-gray-500">{formatDate(record.created_at)}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.cli}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.field}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1">{getStatusLabel(record.status)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{record.old_value || '-'}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{record.new_value || '-'}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{record.structure_code || '-'}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm text-gray-900">{record.username}</div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        isLoading={loading}
        summaryText={`Affichage de ${(currentPage - 1) * itemsPerPage + 1} à ${Math.min(currentPage * itemsPerPage, totalRecords)} sur ${totalRecords} enregistrements`}
      />
    </div>
  );
};

export default AnomalyHistoryTable;