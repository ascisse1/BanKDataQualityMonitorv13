import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { BarChart, PieChart, TrendingUp, Users, AlertTriangle, Building, UserCheck, Upload, RefreshCw, Flag, Database, History } from 'lucide-react';
import StatsCard from './components/StatsCard';
import ClientTypeChart from './components/ClientTypeChart';
import AnomalyTrendChart from './components/AnomalyTrendChart';
import TopAnomalyFields from './components/TopAnomalyFields';
import BranchAnomaliesTable from './components/BranchAnomaliesTable';
import RecentAnomalies from './components/RecentAnomalies';
import ValidationSummary from './components/ValidationSummary';
import DataQualityTrends from './components/DataQualityTrends';
import PerformanceMonitor from './components/PerformanceMonitor';
import FatcaSummary from './components/FatcaSummary';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Skeleton, { SkeletonText, SkeletonStats, SkeletonChart, SkeletonTable } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { apiService } from '../../services/apiService';
import { useToast } from '../../components/ui/Toaster';
import { log } from '../../services/log';
import { useAuth } from '../../context/AuthContext';
import WeeklyCorrectionTrend from './components/WeeklyCorrectionTrend';
import AgencyCorrectionChart from './components/AgencyCorrectionChart';
import DataLoadHistoryTable from './components/DataLoadHistoryTable';
import AgencyUserStats from './components/AgencyUserStats';


interface Stats {
  total: number;
  individual: number;
  corporate: number;
  institutional: number;
  anomalies: number;
  fatca: number;
  pendingTickets: number;
  resolvedTickets: number;
  correctionRate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quality' | 'fatca' | 'tracking'>('quality');
  const { addToast } = useToast();
  const { user } = useAuth();


  const hasUploadAccess = user?.role === 'ADMIN';
  const hasAccessToBranchData = user?.role === 'ADMIN' || user?.role === 'AUDITOR';

  useEffect(() => {
    log.info('ui', 'Dashboard page mounted');
    fetchStats();

    return () => {
      log.info('ui', 'Dashboard page unmounted');
    };
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      log.info('ui', 'Fetching dashboard statistics');
      const response = await apiService.get<ApiResponse<Stats>>('/stats/clients');

      if (response.success && response.data) {
        setStats(response.data);
        setLastUpdate(new Date());

        log.info('ui', 'Stats loaded successfully', {
          recordCount: response.data.total
        });

        log.info('ui', 'Dashboard statistics loaded successfully', {
          total: response.data.total,
          anomalies: response.data.anomalies,
          fatca: response.data.fatca
        });

      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (err) {
      setError('Erreur lors du chargement des statistiques. Veuillez réessayer.');
      addToast('Erreur lors du chargement des statistiques', 'error');
      log.error('api', 'Failed to fetch statistics', { error: err });
      log.error('ui', 'Failed to load dashboard statistics', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      addToast('Actualisation des données en cours...', 'info');

      await fetchStats();

      log.info('ui', 'Dashboard data refreshed successfully');
    } catch (err) {
      addToast('Erreur lors de l\'actualisation', 'error');
      log.error('ui', 'Failed to refresh dashboard data', { error: err });
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStatCards = () => {
    if (!stats) return [];

    return [
      {
        title: 'Total Clients',
        value: (stats.total ?? 0).toLocaleString('fr-FR'),
        icon: <Users className="h-6 w-6 text-primary-600" />,
      },
      {
        title: 'Clients Particuliers',
        value: (stats.individual ?? 0).toLocaleString('fr-FR'),
        icon: <UserCheck className="h-6 w-6 text-success-600" />,
      },
      {
        title: 'Clients Entreprises',
        value: (stats.corporate ?? 0).toLocaleString('fr-FR'),
        icon: <Building className="h-6 w-6 text-secondary-600" />,
      },
      {
        title: 'Anomalies Détectées',
        value: (stats.anomalies ?? 0).toLocaleString('fr-FR'),
        icon: <AlertTriangle className="h-6 w-6 text-warning-600" />,
      },
    ];
  };

  if (isLoading && !lastUpdate) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonText lines={1} className="w-48 mb-2" />
            <SkeletonText lines={1} className="w-72" />
          </div>
          <div className="flex space-x-2">
            <Skeleton variant="rounded" width={120} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonStats key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-error-50 border border-error-200 rounded-lg p-8 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-error-800 dark:text-error-200 mb-2">{error}</h2>
          <p className="text-error-600 dark:text-error-400 mb-6">
            Impossible de charger les données du tableau de bord. Veuillez vérifier votre connexion.
          </p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aperçu de la base de données clients ({(stats?.total ?? 0).toLocaleString('fr-FR')} enregistrements)
            {lastUpdate && (
              <span className="ml-2 text-xs text-gray-400">
                • Derniere mise a jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>

          {hasUploadAccess && (
            <Button
              variant="primary"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => addToast('Fonctionnalite bientot disponible', 'info')}
              disabled={isLoading}
            >
              Charger des données
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats && renderStatCards().map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Tabs for Quality, FATCA and Tracking */}
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as 'quality' | 'fatca' | 'tracking')}>
        <TabList label="Sections du tableau de bord">
          <Tab value="quality" icon={<BarChart className="h-4 w-4" />}>Qualité des Données</Tab>
          <Tab value="fatca" icon={<Flag className="h-4 w-4" />}>FATCA</Tab>
          <Tab value="tracking" icon={<History className="h-4 w-4" />}>Suivi des Corrections</Tab>
        </TabList>

        <TabPanel value="quality">
          <div className="space-y-6">
            <Card
              isLoading={isLoading}
            >
              <ValidationSummary isLoading={isLoading} />
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card
                title="Repartition des Types de Clients"
                isLoading={isLoading}
              >
                <div className="h-56 sm:h-64 lg:h-80 flex items-center justify-center">
                  <ClientTypeChart isLoading={isLoading} />
                </div>
              </Card>

              <Card
                title="Tendances des Anomalies"
                isLoading={isLoading}
              >
                <div className="h-56 sm:h-64 lg:h-80 flex items-center justify-center">
                  <AnomalyTrendChart isLoading={isLoading} />
                </div>
              </Card>
            </div>

            <Card
              title="Évolution de la Qualité des Données"
              isLoading={isLoading}
            >
              <DataQualityTrends isLoading={isLoading} />
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card
                  title="Clients par agence"
                  isLoading={isLoading}
                >
                  <div className="h-96">
                    <TopAnomalyFields isLoading={isLoading} />
                  </div>
                </Card>
              </div>

              {hasAccessToBranchData && (
                <div className="lg:col-span-2">
                  <Card
                    title="Anomalies par agence"
                    isLoading={isLoading}
                  >
                    <div className="h-96 overflow-auto">
                      <BranchAnomaliesTable isLoading={isLoading} />
                    </div>
                  </Card>
                </div>
              )}
            </div>

            <Card
              title="Anomalies Recentes"
              isLoading={isLoading}
            >
              <div className="h-96">
                <RecentAnomalies isLoading={isLoading} />
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="fatca">
          <FatcaSummary isLoading={isLoading} fatcaCount={stats?.fatca || 0} totalClients={stats?.individual || 0} />
        </TabPanel>

        <TabPanel value="tracking">
          <div className="space-y-6">
            <Card
              title="Corrections par Semaine"
              isLoading={isLoading}
            >
              <WeeklyCorrectionTrend isLoading={isLoading} />
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card
                title="Taux de Correction par Agence"
                isLoading={isLoading}
              >
                <div className="h-96">
                  <AgencyCorrectionChart isLoading={isLoading} />
                </div>
              </Card>

              <Card
                title="Utilisateurs par Agence"
                isLoading={isLoading}
              >
                <div className="h-96 overflow-auto">
                  <AgencyUserStats isLoading={isLoading} />
                </div>
              </Card>
            </div>

            <Card
              title="Historique des Chargements"
              isLoading={isLoading}
            >
              <div className="h-96 overflow-auto">
                <DataLoadHistoryTable isLoading={isLoading} />
              </div>
            </Card>

          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
