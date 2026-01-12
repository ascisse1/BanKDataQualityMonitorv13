import { useState, useEffect } from 'react';
import { ArrowDownWideNarrow, RefreshCw, AlertCircle } from 'lucide-react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toaster';

interface BranchAnomaliesTableProps {
  isLoading?: boolean;
}

interface Branch {
  code_agence: string;
  lib_agence: string;
  nombre_anomalies: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

const BranchAnomaliesTable = ({ isLoading: externalLoading = false }: BranchAnomaliesTableProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const hasAccess = user?.role === 'admin' || user?.role === 'auditor';

  useEffect(() => {
    if (hasAccess && !externalLoading) {
      fetchBranchAnomalies();
    } else if (!hasAccess) {
      setError('Vous n\'avez pas les permissions necessaires pour voir ces donnees.');
      setLoading(false);
    }
  }, [hasAccess, externalLoading]);

  const fetchBranchAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<ApiResponse<Branch[]>>('/anomalies/by-branch');

      if (response.success && response.data && response.data.length > 0) {
        setBranches(response.data);
      } else {
        setBranches([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue';
      setError(errorMessage);
      addToast('Erreur lors du chargement des donnees', 'error');
      console.error('Error fetching branch anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (hasAccess) {
      fetchBranchAnomalies();
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(current => {
      const newOrder = current === 'asc' ? 'desc' : 'asc';
      setBranches(current => [...current].sort((a, b) =>
        newOrder === 'asc' ? a.nombre_anomalies - b.nombre_anomalies : b.nombre_anomalies - a.nombre_anomalies
      ));
      return newOrder;
    });
  };

  if (!hasAccess) {
    return (
      <div className="rounded-lg border border-yellow-100 p-6 bg-yellow-50">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-yellow-800">Acces Restreint</h3>
            <p className="text-sm text-yellow-600">Vous n'avez pas les permissions necessaires pour voir ces donnees.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || externalLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded w-full mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 p-6 bg-red-50">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-red-800">Erreur de connexion</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(branches) || branches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune donnee disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agence
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleSortOrder}>
              <div className="flex items-center">
                Anomalies
                <ArrowDownWideNarrow className={`ml-1 h-4 w-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {branches.map((branch) => (
            <tr key={branch.code_agence} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {branch.code_agence}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                <div className="max-w-xs truncate" title={branch.lib_agence}>
                  {branch.lib_agence}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{branch.nombre_anomalies}</span>
                  <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 rounded-full h-2"
                      style={{ width: `${(branch.nombre_anomalies / Math.max(...branches.map(b => b.nombre_anomalies))) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={2} className="px-3 py-2 text-sm font-medium text-gray-900">
              Total
            </td>
            <td className="px-3 py-2 text-sm font-medium text-gray-900">
              {branches.reduce((sum, branch) => sum + branch.nombre_anomalies, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default BranchAnomaliesTable;
