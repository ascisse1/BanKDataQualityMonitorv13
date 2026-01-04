import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { workflowService } from '../../services/workflowService';
import type { WorkflowTask } from '../../services/workflowService';
import { useAuth } from '../../context/AuthContext';
import { CreateTicketModal } from './components/CreateTicketModal';

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (user?.role === 'ADMIN' || user?.role === 'AUDITOR') {
        const allTasks = await workflowService.getGroupTasks('supervisors');
        setTasks(allTasks);
      } else if (user?.id) {
        const userTasks = await workflowService.getUserTasks(user.id);
        setTasks(userTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string) => {
    try {
      if (user?.id) {
        await workflowService.claimTask(taskId, user.id);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to claim task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      if (user?.id) {
        await workflowService.completeTask(taskId, {
          userId: user.id,
          variables: {}
        });
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'assigned') return matchesSearch && task.assignee;
    if (filterStatus === 'unassigned') return matchesSearch && !task.assignee;

    return matchesSearch;
  });

  const getTaskIcon = (taskKey: string) => {
    if (taskKey.includes('validation')) return <CheckCircle className="w-5 h-5 text-blue-600" />;
    if (taskKey.includes('correction')) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <Clock className="w-5 h-5 text-gray-600" />;
  };

  const getTaskBadgeClass = (assignee: string | null) => {
    if (!assignee) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Tickets</h1>
          <p className="mt-1 text-sm text-gray-600">
            Workflow Camunda - Tâches en cours
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Ticket
          </Button>
          <Button onClick={loadTasks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTasks}
      />

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="assigned">Assignées</option>
                <option value="unassigned">Non assignées</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune tâche disponible</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getTaskIcon(task.taskDefinitionKey || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {task.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTaskBadgeClass(task.assignee)}`}>
                          {task.assignee ? 'Assignée' : 'Disponible'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {task.id.substring(0, 8)}...</span>
                        <span>Créée: {new Date(task.created).toLocaleDateString('fr-FR')}</span>
                        {task.due && (
                          <span className="text-orange-600">
                            Échéance: {new Date(task.due).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <p className="mt-1 text-xs text-gray-600">
                          Assignée à: {task.assignee}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!task.assignee && user?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClaimTask(task.id)}
                      >
                        Prendre en charge
                      </Button>
                    )}
                    {task.assignee === user?.id?.toString() && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        Compléter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignées</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.assignee).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => !t.assignee).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
