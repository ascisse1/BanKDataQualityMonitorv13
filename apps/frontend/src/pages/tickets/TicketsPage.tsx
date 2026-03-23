import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, CheckCircle, Clock, AlertCircle, AlertTriangle, User, Ticket } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import { ticketService } from '../../services/ticketService';
import type { TicketDto } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { CreateTicketModal } from './components/CreateTicketModal';

const STATUS_LABELS: Record<string, string> = {
  DETECTED: 'Détecté',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  PENDING_VALIDATION: 'En attente de validation',
  VALIDATED: 'Validé',
  UPDATED_CBS: 'CBS mis à jour',
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
      if (isAgencyUser && user?.agencyCode) {
        result = await ticketService.getTicketsByAgency(user.agencyCode, currentPage - 1, itemsPerPage);
      } else {
        result = await ticketService.getTickets(currentPage - 1, itemsPerPage);
      }

      setTickets(result.content);
      setTotalPages(result.totalPages);
      setTotalRecords(result.totalElements);
    } catch (err) {
      console.error('Failed to load tickets:', err);
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
      ticket.agencyCode?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && ticket.status === filterStatus;
  });

  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incidents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigné à
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">Aucun ticket trouvé</p>
                      <p className="text-gray-400 mt-1">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : 'Aucun ticket créé pour le moment'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-600">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Agence: {ticket.agencyCode || '-'}
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
                          <span className="text-xs text-gray-500">résolus</span>
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
                          <span className="text-sm text-gray-400">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR') : '-'}
                        {ticket.slaBreached && (
                          <div className="text-xs text-red-600 font-medium mt-0.5">
                            SLA dépassé
                          </div>
                        )}
                      </td>
                    </tr>
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
