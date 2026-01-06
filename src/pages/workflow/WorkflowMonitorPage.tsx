import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { rpaService, type RpaJob } from '../../services/rpaService';

export const WorkflowMonitorPage: React.FC = () => {
  const [rpaJobs, setRpaJobs] = useState<RpaJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadRpaJobs();
    const interval = setInterval(loadRpaJobs, 10000);
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const loadRpaJobs = async () => {
    try {
      setLoading(true);
      if (selectedStatus === 'all') {
        const [pending, running, completed, failed] = await Promise.all([
          rpaService.getJobsByStatus('PENDING'),
          rpaService.getJobsByStatus('RUNNING'),
          rpaService.getJobsByStatus('COMPLETED'),
          rpaService.getJobsByStatus('FAILED')
        ]);
        setRpaJobs([...pending, ...running, ...completed, ...failed]);
      } else {
        const jobs = await rpaService.getJobsByStatus(selectedStatus);
        setRpaJobs(jobs);
      }
    } catch (error) {
      console.error('Failed to load RPA jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await rpaService.retryJob(jobId);
      await loadRpaJobs();
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const getStatusIcon = (status: RpaJob['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'RUNNING':
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const calculateDuration = (job: RpaJob): string => {
    if (!job.startedAt) return '-';
    const end = job.completedAt ? new Date(job.completedAt) : new Date();
    const start = new Date(job.startedAt);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const stats = {
    total: rpaJobs.length,
    pending: rpaJobs.filter(j => j.status === 'PENDING').length,
    running: rpaJobs.filter(j => j.status === 'RUNNING').length,
    completed: rpaJobs.filter(j => j.status === 'COMPLETED').length,
    failed: rpaJobs.filter(j => j.status === 'FAILED').length
  };

  if (loading && rpaJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring RPA</h1>
          <p className="mt-1 text-sm text-gray-600">
            Suivi des jobs UiPath en temps réel
          </p>
        </div>
        <Button onClick={loadRpaJobs} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Complétés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setSelectedStatus('RUNNING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'RUNNING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complétés
            </button>
            <button
              onClick={() => setSelectedStatus('FAILED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'FAILED'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Échecs
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {rpaJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun job RPA disponible</p>
            </div>
          ) : (
            rpaJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(job.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {job.action}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rpaService.getStatusBadgeClass(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Job ID: {job.jobId.substring(0, 8)}...</span>
                        <span>Ticket: #{job.ticketId}</span>
                        <span>Durée: {calculateDuration(job)}</span>
                        {job.retryCount > 0 && (
                          <span className="text-orange-600">
                            Tentatives: {job.retryCount}
                          </span>
                        )}
                      </div>
                      {job.errorMessage && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {job.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryJob(job.jobId)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Réessayer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
