import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, User, Building2, Calendar, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { validationService } from '../../services/validationService';
import type { TicketIncidentDto } from '../../services/validationService';
import type { TicketDto } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toaster';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-100',
  HIGH: 'text-orange-600 bg-orange-100',
  MEDIUM: 'text-yellow-600 bg-yellow-100',
  LOW: 'text-green-600 bg-green-100',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Faible',
};

const ValidationPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<Record<number, TicketIncidentDto[]>>({});
  const [loadingIncidents, setLoadingIncidents] = useState<number | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDto | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadValidations();
  }, []);

  const loadValidations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await validationService.getPendingValidations();
      setTickets(data);
    } catch (err) {
      console.error('Error loading validations:', err);
      setError('Erreur lors du chargement des validations');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (ticketId: number) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }

    setExpandedTicketId(ticketId);

    // Load incidents if not already loaded
    if (!incidents[ticketId]) {
      try {
        setLoadingIncidents(ticketId);
        const ticketIncidents = await validationService.getTicketIncidents(ticketId);
        setIncidents(prev => ({ ...prev, [ticketId]: ticketIncidents }));
      } catch (err) {
        console.error('Error loading incidents:', err);
      } finally {
        setLoadingIncidents(null);
      }
    }
  };

  const openDecisionModal = (ticket: TicketDto, dec: 'approved' | 'rejected') => {
    setSelectedTicket(ticket);
    setDecision(dec);
    setComments('');
    setShowDecisionModal(true);
  };

  const handleDecision = async () => {
    if (!selectedTicket || !decision) return;

    if (decision === 'rejected' && !comments.trim()) {
      addToast('Veuillez fournir un motif de refus', 'warning');
      return;
    }

    try {
      setProcessing(true);
      await validationService.validateTicket(
        selectedTicket.id,
        decision === 'approved',
        comments || undefined
      );

      addToast(
        decision === 'approved'
          ? `Ticket ${selectedTicket.ticketNumber} approuvé avec succès`
          : `Ticket ${selectedTicket.ticketNumber} refusé`,
        'success'
      );

      setShowDecisionModal(false);
      setSelectedTicket(null);
      setComments('');
      loadValidations();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du traitement';
      addToast(errorMsg, 'error');
    } finally {
      setProcessing(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Validation 4 Yeux</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tickets en attente de validation hiérarchique
          </p>
        </div>
        <Button onClick={loadValidations} variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">En attente</p>
              <p className="text-3xl font-bold text-orange-900">{tickets.length}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Priorité haute/critique</p>
              <p className="text-3xl font-bold text-red-900">
                {tickets.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total incidents</p>
              <p className="text-3xl font-bold text-blue-900">
                {tickets.reduce((sum, t) => sum + (t.totalIncidents || 0), 0)}
              </p>
            </div>
            <FileText className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadValidations} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Tickets list */}
      {!error && (
        <Card>
          <div className="divide-y divide-gray-200">
            {tickets.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Aucune validation en attente</p>
                <p className="text-gray-400 mt-1">Toutes les corrections ont été traitées</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id}>
                  {/* Ticket row */}
                  <div className={`p-4 hover:bg-gray-50 ${expandedTicketId === ticket.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => toggleExpand(ticket.id)}
                        >
                          {expandedTicketId === ticket.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary-600">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>
                              {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {ticket.clientName || ticket.cli}
                          </div>
                          <div className="text-xs text-gray-500">
                            CLI: {ticket.cli} | Agence: {ticket.agencyCode || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {ticket.assignedTo && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span>{ticket.assignedTo.fullName || ticket.assignedTo.username}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <FileText className="h-3 w-3" />
                            <span>{ticket.totalIncidents} correction{(ticket.totalIncidents || 0) > 1 ? 's' : ''}</span>
                          </div>
                          {ticket.createdAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:border-green-300"
                            onClick={() => openDecisionModal(ticket, 'approved')}
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                          >
                            Approuver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => openDecisionModal(ticket, 'rejected')}
                            leftIcon={<XCircle className="w-4 h-4" />}
                          >
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded incidents */}
                  {expandedTicketId === ticket.id && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                      {loadingIncidents === ticket.id ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          <span className="ml-2 text-sm text-gray-500">Chargement des corrections...</span>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Corrections proposées
                          </h4>
                          <div className="space-y-2">
                            {(incidents[ticket.id] || []).length === 0 ? (
                              <p className="text-sm text-gray-500">Aucun détail de correction disponible</p>
                            ) : (
                              (incidents[ticket.id] || []).map((incident) => (
                                <div key={incident.id} className="p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {incident.fieldLabel || incident.fieldName}
                                      </span>
                                      {incident.fieldName && (
                                        <code className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                          {incident.fieldName}
                                        </code>
                                      )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      incident.status === 'pending_validation' ? 'bg-orange-100 text-orange-800' :
                                      incident.status === 'corrected' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {incident.status === 'pending_validation' ? 'En attente' :
                                       incident.status === 'corrected' ? 'Corrigé' : incident.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <span className="text-red-600">
                                      <strong>Avant:</strong> {incident.oldValue || '<vide>'}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-green-600">
                                      <strong>Après:</strong> {incident.newValue || '<vide>'}
                                    </span>
                                  </div>
                                  {incident.notes && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Note: {incident.notes}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Decision modal */}
      {showDecisionModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {decision === 'approved' ? 'Approuver' : 'Refuser'} le ticket {selectedTicket.ticketNumber}
              </h2>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p><strong>Client:</strong> {selectedTicket.clientName || selectedTicket.cli}</p>
                <p><strong>Agence:</strong> {selectedTicket.agencyCode}</p>
                <p><strong>Soumis par:</strong> {selectedTicket.assignedTo?.fullName || selectedTicket.assignedTo?.username || '-'}</p>
                <p><strong>Corrections:</strong> {selectedTicket.totalIncidents}</p>
              </div>

              {/* 4-eyes warning */}
              {selectedTicket.assignedTo?.username === user?.username && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                  <strong>Attention:</strong> Vous ne pouvez pas valider vos propres corrections (principe 4 Yeux).
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {decision === 'approved' ? 'Commentaires (optionnel)' : 'Motif du refus (obligatoire)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={
                    decision === 'approved'
                      ? 'Ajoutez des commentaires...'
                      : 'Expliquez le motif du refus...'
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant={decision === 'approved' ? 'primary' : 'danger'}
                  onClick={handleDecision}
                  disabled={processing || (selectedTicket.assignedTo?.username === user?.username)}
                  isLoading={processing}
                  className="flex-1"
                  leftIcon={decision === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                >
                  {decision === 'approved' ? "Confirmer l'approbation" : 'Confirmer le refus'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowDecisionModal(false); setComments(''); }}
                  disabled={processing}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPage;
