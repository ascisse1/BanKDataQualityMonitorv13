import { useState, useEffect } from 'react';
import { RefreshCw, GitCompare, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import {
  reconciliationService,
  ReconciliationTask,
  ReconciliationStats,
} from '../../services/reconciliationService';
import { ReconciliationStatsComponent } from './components/ReconciliationStats';
import { ReconciliationFilters } from './components/ReconciliationFilters';
import { ReconciliationTable } from './components/ReconciliationTable';
import { ReconciliationDetails } from './components/ReconciliationDetails';
import { useAuth } from '../../context/AuthContext';

const ReconciliationPage = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ReconciliationTask[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [selectedTask, setSelectedTask] = useState<ReconciliationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [filters, setFilters] = useState({
    agency_code: user?.agencyCode || '',
    client_id: '',
    status: 'pending',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const filterParams: any = {};
      if (filters.agency_code) filterParams.agency_code = filters.agency_code;
      if (filters.client_id) filterParams.client_id = filters.client_id;

      const [tasksData, statsData] = await Promise.all([
        filters.status === 'pending'
          ? reconciliationService.getPendingReconciliations(filterParams)
          : reconciliationService.getReconciliationHistory({
              ...filterParams,
              status: filters.status || undefined,
            }),
        reconciliationService.getReconciliationStats(
          filters.agency_code || user?.agencyCode
        ),
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleReconcileAll = async () => {
    if (reconciling) return;

    setReconciling(true);
    try {
      const result = await reconciliationService.reconcileAll({
        agency_code: filters.agency_code || undefined,
        max_tasks: 50,
      });

      showNotification(
        `Réconciliation terminée: ${result.success} réussies, ${result.failed} échecs sur ${result.total} tâches`,
        result.failed === 0 ? 'success' : 'warning'
      );

      await fetchData();
    } catch (error) {
      showNotification('Erreur lors de la réconciliation en batch', 'error');
    } finally {
      setReconciling(false);
    }
  };

  const handleReconcileTask = async (taskId: string) => {
    try {
      const result = await reconciliationService.reconcileTask(taskId);
      if (result) {
        const matchPercentage = reconciliationService.calculateMatchPercentage(
          result.matched_fields,
          result.total_fields
        );

        showNotification(
          `Réconciliation ${result.status}: ${matchPercentage}% de correspondance (${result.matched_fields}/${result.total_fields})`,
          result.status === 'success' ? 'success' : 'warning'
        );

        await fetchData();
      } else {
        showNotification('Erreur lors de la réconciliation', 'error');
      }
    } catch (error) {
      showNotification('Erreur lors de la réconciliation', 'error');
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      const result = await reconciliationService.retryReconciliation(taskId);
      if (result) {
        const matchPercentage = reconciliationService.calculateMatchPercentage(
          result.matched_fields,
          result.total_fields
        );

        showNotification(
          `Nouvelle tentative ${result.status}: ${matchPercentage}% de correspondance`,
          result.status === 'success' ? 'success' : 'warning'
        );

        await fetchData();
        setSelectedTask(null);
      } else {
        showNotification('Erreur lors de la nouvelle tentative', 'error');
      }
    } catch (error) {
      showNotification('Erreur lors de la nouvelle tentative', 'error');
    }
  };

  const handleExportHistory = async () => {
    try {
      const history = await reconciliationService.getReconciliationHistory({
        agency_code: filters.agency_code || undefined,
      });

      const csvContent = [
        ['Ticket ID', 'Client ID', 'Client', 'Statut', 'Correspondances', 'Tentatives', 'Créé le', 'Réconcilié le'].join(','),
        ...history.map((task) => {
          const matchedFields = task.corrections.filter((c) => c.is_matched).length;
          const totalFields = task.corrections.length;
          return [
            task.ticket_id,
            task.client_id,
            `"${task.client_name}"`,
            reconciliationService.getStatusLabel(task.status),
            `${matchedFields}/${totalFields}`,
            task.attempts,
            new Date(task.created_at).toLocaleString('fr-FR'),
            task.reconciled_at ? new Date(task.reconciled_at).toLocaleString('fr-FR') : '',
          ].join(',');
        }),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reconciliation_history_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      showNotification('Historique exporté avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'export', 'error');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      agency_code: user?.agencyCode || '',
      client_id: '',
      status: 'pending',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <GitCompare className="h-8 w-8 mr-3 text-primary-600" />
            Réconciliation CBS
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vérification des corrections appliquées dans le Core Banking System
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleExportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleReconcileAll}
            disabled={reconciling || tasks.length === 0}
          >
            <GitCompare className="h-4 w-4 mr-2" />
            {reconciling ? 'Réconciliation...' : 'Réconcilier tout'}
          </Button>
        </div>
      </div>

      <ReconciliationStatsComponent stats={stats} loading={loading} />

      <ReconciliationFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      <ReconciliationTable
        tasks={tasks}
        loading={loading}
        onViewDetails={setSelectedTask}
        onReconcile={handleReconcileTask}
        onRetry={handleRetryTask}
      />

      {selectedTask && (
        <ReconciliationDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRetry={handleRetryTask}
        />
      )}
    </div>
  );
};

export default ReconciliationPage;
