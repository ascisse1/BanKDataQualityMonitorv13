import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, CheckCircle, Clock, AlertCircle, AlertTriangle, User, Ticket, ChevronDown, ChevronUp, FileWarning, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { ticketService } from '../../services/ticketService';
import type { TicketDto, TicketAnomalyDto } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { CreateTicketModal } from './components/CreateTicketModal';
import { log } from '../../services/log';

const STATUS_LABELS: Record<string, string> = {
  DETECTED: 'Détecté',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  PENDING_VALIDATION: 'En attente de validation',
  VALIDATED: 'Validé',
  UPDATED_CBS: 'CBS mis à jour',
  CBS_UPDATE_FAILED: 'Échec mise à jour CBS',
  CLOSED: 'Clôturé',
  REJECTED: 'Rejeté',
};

const STATUS_COLORS: Record<string, string> = {
  DETECTED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PENDING_VALIDATION: 'bg-orange-100 text-orange-800',
  VALIDATED: 'bg-green-100 text-green-800',
  UPDATED_CBS: 'bg-teal-100 text-teal-800',
  CBS_UPDATE_FAILED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Faible',
};

const ANOMALY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  CORRECTED: 'Corrige',
  VALIDATED: 'Valide',
  REJECTED: 'Rejete',
  CLOSED: 'Cloture',
};

const ANOMALY_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  CORRECTED: 'bg-blue-100 text-blue-800',
  VALIDATED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'bg-error-100 text-error-800',
  MEDIUM: 'bg-warning-100 text-warning-800',
  LOW: 'bg-gray-100 text-gray-800',
};

const SEVERITY_LABELS: Record<string, string> = {
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Faible',
};

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [itemsPerPage] = useState(20);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [ticketAnomalies, setTicketAnomalies] = useState<TicketAnomalyDto[]>([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);

  const isAgencyUser = user?.role === 'AGENCY_USER';

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, currentPage, filterStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (isAgencyUser && user?.structureCode) {
        result = await ticketService.getTicketsByAgency(user.structureCode, currentPage - 1, itemsPerPage);
      } else {
        result = await ticketService.getTickets(currentPage - 1, itemsPerPage);
      }

      setTickets(result.content);
      setTotalPages(result.totalPages);
      setTotalRecords(result.totalElements);
    } catch (err) {
      log.error('api', 'Failed to load tickets', { error: err });
      setError('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm ||
      ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.cli?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.structureCode?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && ticket.status === filterStatus;
  });

  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleTicketExpand = async (ticketId: number) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      setTicketAnomalies([]);
      return;
    }
    setExpandedTicketId(ticketId);
    setAnomaliesLoading(true);
    try {
      const anomalies = await ticketService.getTicketAnomalies(ticketId);
      setTicketAnomalies(anomalies);
    } catch (err) {
      log.error('api', 'Failed to load ticket anomalies', { error: err });
      setTicketAnomalies([]);
    } finally {
      setAnomaliesLoading(false);
    }
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
            Suivi des corrections et validations 4 Yeux
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Ticket
          </Button>
          <Button onClick={loadTickets} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTickets}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
              </div>
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(statusCounts['IN_PROGRESS'] || 0) + (statusCounts['ASSIGNED'] || 0) + (statusCounts['DETECTED'] || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente validation</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statusCounts['PENDING_VALIDATION'] || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clôturés</p>
                <p className="text-2xl font-bold text-green-600">
                  {(statusCounts['CLOSED'] || 0) + (statusCounts['VALIDATED'] || 0)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher par ticket, CLI, client ou agence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="DETECTED">Détecté</option>
                <option value="ASSIGNED">Assigné</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="PENDING_VALIDATION">En attente de validation</option>
                <option value="VALIDATED">Validé</option>
                <option value="CLOSED">Clôturé</option>
                <option value="REJECTED">Rejeté</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTickets} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Tickets table */}
        {!error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incidents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigne a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">Aucun ticket trouve</p>
                      <p className="text-gray-400 mt-1">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : 'Aucun ticket cree pour le moment'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <React.Fragment key={ticket.id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer ${expandedTicketId === ticket.id ? 'bg-primary-50' : ''}`}
                        onClick={() => toggleTicketExpand(ticket.id)}
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                            {expandedTicketId === ticket.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-primary-600">
                            {ticket.ticketNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Agence: {ticket.structureCode || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.clientName || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            CLI: {ticket.cli}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[ticket.status] || ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>
                            {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900">
                              {ticket.resolvedIncidents}/{ticket.totalIncidents}
                            </span>
                            <span className="text-xs text-gray-500">resolus</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary-600" />
                              </div>
                              <span className="text-sm text-gray-900">
                                {ticket.assignedTo.fullName || ticket.assignedTo.username}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Non assigne</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR') : '-'}
                          {ticket.slaBreached && (
                            <div className="text-xs text-red-600 font-medium mt-0.5">
                              SLA depasse
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expanded anomaly details */}
                      {expandedTicketId === ticket.id && (
                        <tr>
                          <td colSpan={8} className="px-0 py-0">
                            <div className="bg-gray-50 border-l-4 border-primary-500">
                              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  <FileWarning className="h-4 w-4 text-warning-500" />
                                  Anomalies liees au ticket
                                </h3>
                              </div>

                              {anomaliesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                                </div>
                              ) : ticketAnomalies.length === 0 ? (
                                <div className="text-center py-8">
                                  <p className="text-sm text-gray-500">Aucune anomalie liee a ce ticket</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-200">
                                  {ticketAnomalies.map((anomaly) => (
                                    <div key={anomaly.id} className="px-6 py-4 bg-white hover:bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-gray-900">
                                                {anomaly.fieldLabel || anomaly.fieldName}
                                              </span>
                                              {anomaly.fieldName && (
                                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                  {anomaly.fieldName}
                                                </code>
                                              )}
                                            </div>
                                            <p className="text-sm text-error-600 mt-0.5">
                                              {anomaly.errorMessage}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {anomaly.severity && (
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${SEVERITY_COLORS[anomaly.severity] || 'bg-gray-100 text-gray-800'}`}>
                                              {SEVERITY_LABELS[anomaly.severity] || anomaly.severity}
                                            </span>
                                          )}
                                          {anomaly.status && (
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ANOMALY_STATUS_COLORS[anomaly.status] || 'bg-gray-100 text-gray-800'}`}>
                                              {ANOMALY_STATUS_LABELS[anomaly.status] || anomaly.status}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                          <span className="text-gray-500">Valeur actuelle:</span>
                                          <span className="ml-1 font-medium text-gray-700">{anomaly.currentValue || '<vide>'}</span>
                                        </div>
                                        {anomaly.expectedValue && (
                                          <div>
                                            <span className="text-gray-500">Valeur attendue:</span>
                                            <span className="ml-1 font-medium text-gray-700">{anomaly.expectedValue}</span>
                                          </div>
                                        )}
                                        {anomaly.correctionValue && (
                                          <div>
                                            <span className="text-gray-500">Correction:</span>
                                            <span className="ml-1 font-medium text-success-600">{anomaly.correctionValue}</span>
                                          </div>
                                        )}
                                        {anomaly.correctedBy && (
                                          <div>
                                            <span className="text-gray-500">Corrige par:</span>
                                            <span className="ml-1 font-medium text-gray-700">{anomaly.correctedBy}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          isLoading={loading}
        />
      )}
    </div>
  );
};
