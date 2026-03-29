import { useState, useEffect } from 'react';
import { Users, RefreshCw, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toaster';
import Button from '../../../components/ui/Button';
import { log } from '../../../services/log';

interface AgencyUserStatsProps {
  isLoading?: boolean;
}

interface AgencyUserStat {
  structure_code: string;
  user_count: number;
  last_activity: string | null;
}

const AgencyUserStats = ({ isLoading = false }: AgencyUserStatsProps) => {
  const [stats, setStats] = useState<AgencyUserStat[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      fetchStats();
    }
  }, [isLoading, retryCount]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real API call
      setStats([]);

    } catch (error) {
      log.error('api', 'Error fetching agency user stats', { error });
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
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
                    <div className="text-sm font-medium text-gray-900">{stat.structure_code}</div>
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