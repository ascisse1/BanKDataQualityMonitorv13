import { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, XSquare, Clock, RefreshCw, Shield, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { db } from '@/services/db';
import { useToast } from '@/components/ui/Toaster';
import { log } from '@/services/log';

interface FatcaStatsProps {
  isLoading?: boolean;
  clientType?: string;
}

const FatcaStats = ({ isLoading = false, clientType = 'all' }: FatcaStatsProps) => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => { fetchStats(); }, [clientType]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.getFatcaStats();
      setStats(data);
    } catch (error) {
      setError('Erreur lors du chargement des statistiques FATCA');
      log.error('api', 'Error fetching FATCA stats', { error });
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <Card key={i} isLoading={true} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-100 p-6 bg-error-50 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-error-500 mx-auto" />
        <h3 className="text-lg font-medium text-error-800">{error}</h3>
        <Button variant="primary" onClick={fetchStats} leftIcon={<RefreshCw className="h-4 w-4" />}>Reessayer</Button>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Clients FATCA', value: stats.totalClients, icon: <Users className="h-5 w-5 text-primary-600" />, bg: 'bg-primary-100', color: 'text-primary-600' },
    { label: 'A verifier', value: stats.pendingReview, icon: <Clock className="h-5 w-5 text-warning-600" />, bg: 'bg-warning-100', color: 'text-warning-600' },
    { label: 'Conformes', value: stats.compliantClients, icon: <CheckSquare className="h-5 w-5 text-success-600" />, bg: 'bg-success-100', color: 'text-success-600' },
    { label: 'Non conformes', value: stats.nonCompliantClients, icon: <XSquare className="h-5 w-5 text-error-600" />, bg: 'bg-error-100', color: 'text-error-600' },
    { label: 'En investigation', value: stats.underInvestigation, icon: <Shield className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-100', color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center">
            <div className={`p-2 ${c.bg} rounded-full`}>{c.icon}</div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{c.label}</p>
              <p className={`text-lg font-semibold ${c.color}`}>{(c.value || 0).toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FatcaStats;
