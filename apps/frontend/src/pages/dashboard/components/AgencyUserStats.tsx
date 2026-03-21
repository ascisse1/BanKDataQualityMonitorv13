import { useState, useEffect } from 'react';
import { Users, RefreshCw, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toaster';
import Button from '../../../components/ui/Button';

interface AgencyUserStatsProps {
  isLoading?: boolean;
}

interface AgencyUserStat {
  agency_code: string;
  user_count: number;
  last_activity: string | null;
}

const AgencyUserStats = ({ isLoading = false }: AgencyUserStatsProps) => {
  const [stats, setStats] = useState<AgencyUserStat[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  const { addToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (useHardcodedData) {
        // Utiliser directement les données en dur
        const hardcodedData = [
          { agency_code: "01001", user_count: 5, last_activity: "2025-06-28T10:15:30.000Z" },
          { agency_code: "01002", user_count: 3, last_activity: "2025-06-27T14:25:10.000Z" },
          { agency_code: "01003", user_count: 4, last_activity: "2025-06-26T09:45:20.000Z" },
          { agency_code: "01004", user_count: 2, last_activity: "2025-06-25T16:35:40.000Z" },
          { agency_code: "01005", user_count: 3, last_activity: "2025-06-24T11:55:15.000Z" }
        ];
        setStats(hardcodedData);
        setLoading(false);
      } else {
        fetchStats();
      }
    }
  }, [isLoading, retryCount]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate test data
      const testData = generateTestData();
      setStats(testData);
      
    } catch (error) {
      console.error('Error fetching agency user stats:', error);
      setError('Erreur lors du chargement des statistiques');
      
      // Generate test data in case of error
      setStats(generateTestData());
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = (): AgencyUserStat[] => {
    const result: AgencyUserStat[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      result.push({
        agency_code: `0${1200 + i}`,
        user_count: Math.floor(Math.random() * 5) + 1,
        last_activity: Math.random() > 0.2 ? date.toISOString() : null
      });
    }
    
    return result;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    addToast('Tentative de rechargement des statistiques...', 'info');
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
            onClick={handleRetry}
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
              Agence
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Utilisateurs
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dernière activité
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">Aucun utilisateur d'agence</p>
                  <p className="text-sm">Les utilisateurs d'agence apparaîtront ici</p>
                </div>
              </td>
            </tr>
          ) : (
            stats.map((stat, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{stat.agency_code}</div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="text-sm text-gray-500">{stat.user_count}</div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(stat.last_activity)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AgencyUserStats;