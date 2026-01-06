import { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, XSquare, Clock, RefreshCw } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';

interface FatcaStatsProps {
  isLoading?: boolean;
  clientType?: string;
}

const FatcaStats = ({ isLoading = false, clientType = 'all' }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (useHardcodedData) {
      // Utiliser directement les données en dur
      setStats({
        total: 1250,
        individual: 850,
        corporate: 400,
        toVerify: 850,
        confirmed: 320,
        excluded: 80,
        pending: 0,
        currentMonth: 125
      });
      setLoading(false);
    } else {
      fetchStats();
    }
  }, [clientType]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await db.getFatcaStats(clientType);
      setStats(data);
    } catch (error) {
      setError('Erreur lors du chargement des statistiques FATCA');
      console.error('Error fetching FATCA stats:', error);
      
      // Fallback data
      setStats({
        total: 1250,
        individual: 850,
        corporate: 400,
        toVerify: 850,
        confirmed: 320,
        excluded: 80,
        pending: 0,
        currentMonth: 125
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} isLoading={true} />
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
            onClick={fetchStats}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Determine which stats to display based on client type
  const displayTotal = clientType === 'all' ? stats.total : 
                       clientType === '1' ? stats.individual : 
                       clientType === '2' ? stats.corporate : stats.total;
  
  // Calculate proportional values for the selected client type
  const proportion = displayTotal / stats.total;
  const displayToVerify = Math.round(stats.toVerify * proportion);
  const displayConfirmed = Math.round(stats.confirmed * proportion);
  const displayExcluded = Math.round(stats.excluded * proportion);
  const displayCurrentMonth = Math.round(stats.currentMonth * proportion);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-primary-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total Clients FATCA</p>
            <p className="text-lg font-semibold text-gray-900">{displayTotal.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-warning-100 rounded-full">
            <Clock className="h-5 w-5 text-warning-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">À documenter</p>
            <p className="text-lg font-semibold text-warning-600">{displayToVerify.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-success-100 rounded-full">
            <CheckSquare className="h-5 w-5 text-success-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Déclarables</p>
            <p className="text-lg font-semibold text-success-600">{displayConfirmed.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-primary-100 rounded-full">
            <XSquare className="h-5 w-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Non déclarables</p>
            <p className="text-lg font-semibold text-primary-600">{displayExcluded.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-error-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-error-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Récalcitrants</p>
            <p className="text-lg font-semibold text-error-600">{stats.pending?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FatcaStats;