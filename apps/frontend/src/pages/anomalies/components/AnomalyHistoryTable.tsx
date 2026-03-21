import { useState, useEffect } from 'react';
import { History, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toaster';
import { useAuth } from '../../../context/AuthContext';

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
  agency_code: string | null;
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
  const [useHardcodedData, setUseHardcodedData] = useState(false);

  // Vérifier si l'utilisateur est un utilisateur d'agence
  const isAgencyUser = user?.role === 'agency_user';
  const userAgencyCode = user?.agencyCode;

  useEffect(() => {
    fetchHistory();
  }, [cli, field, currentPage]);

  const fetchHistory = async () => {
    if (useHardcodedData) {
      // Use hardcoded data in production/demo mode
      const testData = generateTestData();
      setHistory(testData);
      setTotalRecords(testData.length);
      setTotalPages(Math.ceil(testData.length / itemsPerPage));
      setLoading(false);
      return;
    }
    
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
      if (isAgencyUser && userAgencyCode) {
        url += `&agencyCode=${userAgencyCode}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
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
      console.error('Error fetching anomaly history:', error);
      setError('Erreur lors du chargement de l\'historique');
      
      // Générer des données de test en cas d'erreur
      const testData = generateTestData();
      setHistory(testData);
      setTotalRecords(testData.length);
      setTotalPages(Math.ceil(testData.length / itemsPerPage));
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = (): AnomalyHistoryRecord[] => {
    const statuses: ('detected' | 'in_review' | 'fixed' | 'rejected')[] = ['detected', 'in_review', 'fixed', 'rejected'];
    const fields = ['nid', 'nmer', 'dna', 'nat', 'nrc', 'datc', 'rso'];
    const users = [
      { id: 1, username: 'admin', full_name: 'Administrateur Système' },
      { id: 2, username: 'auditor', full_name: 'Auditeur Principal' },
      { id: 3, username: 'agency_01201', full_name: 'Utilisateur Agence Principale 1' }
    ];
    
    const result: AnomalyHistoryRecord[] = [];
    
    for (let i = 1; i <= 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i % 30);
      
      const status = statuses[i % statuses.length];
      const fieldName = fields[i % fields.length];
      const user = users[i % users.length];
      const clientId = cli || `CLI${String(i % 20 + 1).padStart(6, '0')}`;
      const agencyCode = userAgencyCode || `0${1200 + (i % 30)}`;
      
      result.push({
        id: i,
        cli: clientId,
        field: field || fieldName,
        old_value: status === 'fixed' ? '' : null,
        new_value: status === 'fixed' ? 'Corrigé' : null,
        status,
        agency_code: agencyCode,
        user_id: user.id,
        created_at: date.toISOString(),
        username: user.username,
        full_name: user.full_name
      });
    }
    
    return result;
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
                    <div className="text-sm text-gray-500">{record.agency_code || '-'}</div>
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
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalRecords)} sur {totalRecords} enregistrements
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Précédent
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronLeft = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default AnomalyHistoryTable;