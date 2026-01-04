import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { reconciliationApiService, ReconciliationTask, ReconciliationStats } from '../../services/reconciliationApiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ReconciliationDashboard() {
  const [tasks, setTasks] = useState<ReconciliationTask[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reconciled' | 'failed'>('pending');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([
        filter === 'pending'
          ? reconciliationApiService.getPendingTasks()
          : reconciliationApiService.getHistory({ status: filter === 'all' ? undefined : filter }),
        reconciliationApiService.getStats()
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (taskId: string) => {
    setReconciling(taskId);
    try {
      const result = await reconciliationApiService.reconcileTask(taskId);

      if (result.status === 'success') {
        alert(`Réconciliation réussie: ${result.matched_fields}/${result.total_fields} champs correspondent`);
      } else {
        alert(`Réconciliation partielle: ${result.matched_fields}/${result.total_fields} champs correspondent`);
      }

      loadData();
    } catch (error) {
      console.error('Erreur réconciliation:', error);
      alert('Erreur lors de la réconciliation');
    } finally {
      setReconciling(null);
    }
  };

  const handleReconcileAll = async () => {
    if (!confirm('Réconcilier toutes les tâches en attente ?')) return;

    setLoading(true);
    try {
      const result = await reconciliationApiService.reconcileAll(undefined, 50);
      alert(`Réconciliation terminée:\n✅ Réussis: ${result.success}\n❌ Échoués: ${result.failed}`);
      loadData();
    } catch (error) {
      console.error('Erreur réconciliation batch:', error);
      alert('Erreur lors de la réconciliation en masse');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      reconciled: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status === 'pending' ? 'En attente' : status === 'reconciled' ? 'Réconcilié' : status === 'partial' ? 'Partiel' : 'Échoué'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Réconciliation CBS</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="secondary" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {filter === 'pending' && tasks.length > 0 && (
            <Button onClick={handleReconcileAll} disabled={loading}>
              Réconcilier tout
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_pending}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-600">{stats.reconciled_today}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Échoués</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed_today}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux succès</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.success_rate}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Temps moyen</p>
                <p className="text-2xl font-bold text-gray-600">{stats.average_reconciliation_time}s</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'pending', 'reconciled', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'reconciled' ? 'Réconciliés' : 'Échoués'}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune tâche à afficher
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Corrections</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        {getStatusBadge(task.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{task.ticket_id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{task.client_name}</div>
                        <div className="text-sm text-gray-500">{task.client_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{task.agency_code}</td>
                    <td className="px-4 py-3">{task.corrections?.length || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(task.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {task.status === 'pending' || task.status === 'failed' ? (
                        <Button
                          size="sm"
                          onClick={() => handleReconcile(task.id)}
                          disabled={reconciling === task.id}
                        >
                          {reconciling === task.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Réconcilier'
                          )}
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
