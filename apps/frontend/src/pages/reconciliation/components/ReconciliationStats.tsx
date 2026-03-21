import { CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { ReconciliationStats } from '../../../services/reconciliationService';
import Card from '../../../components/ui/Card';

interface ReconciliationStatsProps {
  stats: ReconciliationStats | null;
  loading: boolean;
}

export const ReconciliationStatsComponent = ({ stats, loading }: ReconciliationStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      name: 'En attente',
      value: stats.total_pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Réconciliés aujourd\'hui',
      value: stats.reconciled_today,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Échecs aujourd\'hui',
      value: stats.failed_today,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Taux de succès',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.name}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}

      {stats.average_reconciliation_time > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Temps moyen de réconciliation
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.average_reconciliation_time / 60).toFixed(1)} minutes
              </p>
            </div>
            <div className="flex space-x-4">
              {stats.by_status.map((item) => (
                <div key={item.status} className="text-center">
                  <p className="text-sm text-gray-600 capitalize">{item.status}</p>
                  <p className="text-xl font-semibold text-gray-900">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
