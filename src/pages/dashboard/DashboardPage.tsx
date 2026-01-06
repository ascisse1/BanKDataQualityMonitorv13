import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
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
import Button from '../../components/ui/Button';
import { db } from '../../services/db';
import { useToast } from '../../components/ui/Toaster';
import { logger } from '../../services/logger';
import { useAuth } from '../../context/AuthContext';
import WeeklyCorrectionTrend from './components/WeeklyCorrectionTrend';
import AgencyCorrectionChart from './components/AgencyCorrectionChart';
import DataLoadHistoryTable from './components/DataLoadHistoryTable';
import AgencyUserStats from './components/AgencyUserStats';
import { useNotification } from '../../context/NotificationContext';
import { useDataFetching } from '../../hooks/useDataFetching';
import { tracer } from '../../services/tracer';

interface Stats {
  total: number;
  individual: number;
  corporate: number;
  institutional?: number;
  anomalies: number;
  fatca?: number;
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
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  const { showNotification } = useNotification();
  const { fetchData } = useDataFetching();

  const hasUploadAccess = user?.role === 'admin';
  const hasAccessToBranchData = user?.role === 'admin' || user?.role === 'auditor';

  useEffect(() => {
    tracer.info('ui', 'Dashboard page mounted');
    if (!useHardcodedData) {
      fetchStats();
    } else {
      // Utiliser directement les données en dur
      setStats({
        total: 325037,
        individual: 290000,
        corporate: 30000,
        institutional: 5037,
        anomalies: 55000,
        fatca: 12470
      });
      setIsLoading(false);
      setLastUpdate(new Date());
    }
    
    return () => {
      tracer.info('ui', 'Dashboard page unmounted');
    };
  }, [useHardcodedData]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      tracer.info('ui', 'Fetching dashboard statistics');
      showNotification('Chargement des données en cours...', 'loading');
      
      // Fetch real data from API with a shorter timeout
      const clientStats = await db.getClientStats();
      
      if (clientStats) {
        setStats(clientStats);
        setLastUpdate(new Date());
        
        logger.info('dashboard', 'Stats loaded successfully', {
          recordCount: clientStats.total
        });
        
        tracer.info('ui', 'Dashboard statistics loaded successfully', {
          total: clientStats.total,
          anomalies: clientStats.anomalies,
          fatca: clientStats.fatca
        });
        
        showNotification('Données chargées avec succès', 'success');
      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (error) {
      setError('Erreur lors du chargement des statistiques. Veuillez réessayer.');
      showNotification('Erreur lors du chargement des statistiques', 'error');
      logger.error('api', 'Failed to fetch statistics', { error });
      tracer.error('ui', 'Failed to load dashboard statistics', { 
        error: error instanceof Error ? error.message : String(error),
        name: error.name,
        stack: error.stack
      });
      
      // Set fallback data
      setStats({
        total: 325037,
        individual: 290000,
        corporate: 30000,
        institutional: 5037,
        anomalies: 55000,
        fatca: 12470
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      // Si on utilise les données en dur, on simule juste un rafraîchissement
      if (useHardcodedData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setLastUpdate(new Date());
      } else {
        addToast('Actualisation des données en cours...', 'info');
        
        // Clear the cache to force fresh data
        await db.clearCache();
        
        // Fetch stats again
        await fetchStats();
        
        // Simulate a delay for the loading animation
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      showNotification('Données actualisées avec succès', 'success');
      tracer.info('ui', 'Dashboard data refreshed successfully');
    } catch (error) {
      showNotification('Erreur lors de l\'actualisation', 'error');
      tracer.error('ui', 'Failed to refresh dashboard data', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStatCards = () => {
    if (!stats) return null;
    
    return [
      {
        title: 'Total Clients',
        value: stats.total.toLocaleString('fr-FR'),
        change: '+2.5%',
        trend: 'up',
        icon: <Users className="h-6 w-6 text-primary-600" />,
      },
      {
        title: 'Clients Particuliers',
        value: stats.individual.toLocaleString('fr-FR'),
        change: '+1.8%',
        trend: 'up',
        icon: <UserCheck className="h-6 w-6 text-success-600" />,
      },
      {
        title: 'Clients Entreprises',
        value: stats.corporate.toLocaleString('fr-FR'),
        change: '+3.2%',
        trend: 'up',
        icon: <Building className="h-6 w-6 text-secondary-600" />,
      },
      {
        title: 'Anomalies Détectées',
        value: stats.anomalies.toLocaleString('fr-FR'),
        change: '-5.1%',
        trend: 'down',
        icon: <AlertTriangle className="h-6 w-6 text-warning-600" />,
      },
    ];
  };

  if (isLoading && !lastUpdate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner 
          size="lg" 
          text="Chargement des données..." 
        />
      </div>
    );
  }

  if (error && !lastUpdate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-error-50 border border-error-200 rounded-lg p-8 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-error-800 mb-2">{error}</h2>
          <p className="text-error-600 mb-6">
            Impossible de charger les données du tableau de bord. Veuillez vérifier votre connexion à la base de données.
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
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">
            Aperçu de la base de données clients ({stats?.total.toLocaleString('fr-FR') || '...'} enregistrements)
            {lastUpdate && (
              <span className="ml-2 text-xs text-gray-400">
                • Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
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
              onClick={() => showNotification('Fonctionnalité bientôt disponible', 'info')}
              disabled={isLoading}
            >
              Charger des données
            </Button>
          )}
        </div>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats && renderStatCards().map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend as 'up' | 'down' | 'neutral'}
            icon={stat.icon}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Tabs for Quality, FATCA and Tracking */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('quality')}
            className={`${
              activeTab === 'quality'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <BarChart className="h-4 w-4" />
            <span>Qualité des Données</span>
          </button>
          <button
            onClick={() => setActiveTab('fatca')}
            className={`${
              activeTab === 'fatca'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Flag className="h-4 w-4" />
            <span>FATCA</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`${
              activeTab === 'tracking'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <History className="h-4 w-4" />
            <span>Suivi des Corrections</span>
          </button>
        </nav>
      </div>

      {activeTab === 'quality' ? (
        <>
          <Card
            title="Résumé de la Validation"
            description="Vue d'ensemble de la qualité des données par catégorie"
            isLoading={isLoading}
          >
            <ValidationSummary isLoading={isLoading} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title="Répartition des Types de Clients"
              description="Répartition des types de clients dans la base de données"
              isLoading={isLoading}
            >
              <div className="h-80 flex items-center justify-center">
                <ClientTypeChart isLoading={isLoading} />
              </div>
            </Card>

            <Card
              title="Tendances des Anomalies"
              description="Tendances hebdomadaires des détections d'anomalies"
              isLoading={isLoading}
            >
              <div className="h-80 flex items-center justify-center">
                <AnomalyTrendChart isLoading={isLoading} />
              </div>
            </Card>
          </div>

          <Card
            title="Évolution de la Qualité des Données"
            description="Tendances de la qualité des données sur les 6 derniers mois"
            isLoading={isLoading}
          >
            <DataQualityTrends isLoading={isLoading} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card
                title="Nombre de clients par agence"
                description="Liste détaillée des clients par agence (optimisé pour gros volumes)"
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
                  title="Nombre d'anomalies par agence"
                  description="Liste détaillée des anomalies par agence (optimisé pour gros volumes)"
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
            title="Anomalies Récentes"
            description="Derniers problèmes de données détectés"
            isLoading={isLoading}
          >
            <div className="h-96">
              <RecentAnomalies isLoading={isLoading} />
            </div>
          </Card>
        </>
      ) : activeTab === 'fatca' ? (
        <FatcaSummary isLoading={isLoading} fatcaCount={stats?.fatca || 0} totalClients={stats?.individual || 0} />
      ) : (
        <>
          <Card
            title="Évolution des Corrections par Semaine"
            description="Tendance hebdomadaire des corrections d'anomalies"
            isLoading={isLoading}
          >
            <WeeklyCorrectionTrend isLoading={isLoading} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title="Taux de Correction par Agence"
              description="Classement des agences par taux de correction"
              isLoading={isLoading}
            >
              <div className="h-96">
                <AgencyCorrectionChart isLoading={isLoading} />
              </div>
            </Card>

            <Card
              title="Utilisateurs par Agence"
              description="Répartition des utilisateurs par agence"
              isLoading={isLoading}
            >
              <div className="h-96 overflow-auto">
                <AgencyUserStats isLoading={isLoading} />
              </div>
            </Card>
          </div>

          <Card
            title="Historique des Chargements de Données"
            description="Suivi des chargements de données par table"
            isLoading={isLoading}
          >
            <div className="h-96 overflow-auto">
              <DataLoadHistoryTable isLoading={isLoading} />
            </div>
          </Card>

          <Card className="border-primary-200 bg-primary-50">
            <div className="p-6">
              <h3 className="text-lg font-medium text-primary-800 mb-4">Suivi des Corrections</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary-700">Chargement Hebdomadaire</h4>
                  <ul className="text-sm text-primary-600 space-y-1">
                    <li>• Chargement des tables clients chaque semaine</li>
                    <li>• Détection automatique des anomalies</li>
                    <li>• Historisation des modifications</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary-700">Suivi par Agence</h4>
                  <ul className="text-sm text-primary-600 space-y-1">
                    <li>• Utilisateurs dédiés par agence</li>
                    <li>• Statistiques de correction par agence</li>
                    <li>• Taux de correction hebdomadaire</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary-700">Rapports</h4>
                  <ul className="text-sm text-primary-600 space-y-1">
                    <li>• Évolution des corrections dans le temps</li>
                    <li>• Classement des agences par performance</li>
                    <li>• Historique des chargements de données</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;