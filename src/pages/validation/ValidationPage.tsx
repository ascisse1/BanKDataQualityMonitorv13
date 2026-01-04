import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, User, Building2, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { validationService, PendingValidation } from '../../services/validationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toaster';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ValidationPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [validations, setValidations] = useState<PendingValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValidation, setSelectedValidation] = useState<PendingValidation | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAgency, setFilterAgency] = useState<string>('all');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadValidations();
  }, [filterPriority, filterAgency]);

  const loadValidations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterPriority !== 'all') filters.priority = filterPriority;
      if (filterAgency !== 'all') filters.agency_code = filterAgency;

      const data = await validationService.getPendingValidations(filters);
      setValidations(data);
    } catch (error) {
      console.error('Error loading validations:', error);
      addToast('Erreur lors du chargement des validations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!selectedValidation || !decision || !user) return;

    if (decision === 'rejected' && !comments.trim()) {
      addToast('Veuillez fournir un motif de refus', 'warning');
      return;
    }

    try {
      setProcessing(true);

      const success =
        decision === 'approved'
          ? await validationService.approveValidation(
              selectedValidation.id,
              user.id,
              `${user.firstName} ${user.lastName}`,
              user.role,
              comments
            )
          : await validationService.rejectValidation(
              selectedValidation.id,
              user.id,
              `${user.firstName} ${user.lastName}`,
              user.role,
              comments
            );

      if (success) {
        addToast(
          `Validation ${decision === 'approved' ? 'approuvée' : 'refusée'} avec succès`,
          'success'
        );
        setShowDecisionModal(false);
        setSelectedValidation(null);
        setComments('');
        loadValidations();
      } else {
        addToast('Erreur lors de la validation', 'error');
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      addToast('Erreur lors du traitement de la décision', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDecisionModal = (validation: PendingValidation, dec: 'approved' | 'rejected') => {
    setSelectedValidation(validation);
    setDecision(dec);
    setShowDecisionModal(true);
  };

  const filteredValidations = validations;

  const uniqueAgencies = Array.from(
    new Set(validations.map((v) => v.agency_code))
  ).map((code) => {
    const validation = validations.find((v) => v.agency_code === code);
    return {
      code,
      name: validation?.agency_name || code,
    };
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Validation Hiérarchique</h1>
          <p className="mt-1 text-gray-600">Contrôle "4 yeux" des corrections</p>
        </div>
        <div className="flex gap-4">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les priorités</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          <select
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les agences</option>
            {uniqueAgencies.map((agency) => (
              <option key={agency.code} value={agency.code}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">En Attente</p>
              <p className="text-3xl font-bold text-blue-900">
                {validations.filter((v) => v.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Critiques</p>
              <p className="text-3xl font-bold text-red-900">
                {validations.filter((v) => v.priority === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approuvées Aujourd'hui</p>
              <p className="text-3xl font-bold text-green-900">0</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Refusées Aujourd'hui</p>
              <p className="text-3xl font-bold text-orange-900">0</p>
            </div>
            <XCircle className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Corrections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Soumission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValidations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune validation en attente</p>
                  </td>
                </tr>
              ) : (
                filteredValidations.map((validation) => (
                  <tr key={validation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${validationService.getPriorityColor(
                          validation.priority
                        )}`}
                      >
                        {validationService.getPriorityLabel(validation.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {validation.client_name}
                          </div>
                          <div className="text-xs text-gray-500">{validation.client_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{validation.agent_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        <div className="text-sm text-gray-900">{validation.agency_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {validation.corrections.length} correction(s)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(validation.submitted_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openDecisionModal(validation, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDecisionModal(validation, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showDecisionModal && selectedValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {decision === 'approved' ? 'Approuver' : 'Refuser'} la validation
              </h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Détails du client</h3>
                <p><strong>Nom:</strong> {selectedValidation.client_name}</p>
                <p><strong>ID:</strong> {selectedValidation.client_id}</p>
                <p><strong>Agent:</strong> {selectedValidation.agent_name}</p>
                <p><strong>Agence:</strong> {selectedValidation.agency_name}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Corrections proposées ({selectedValidation.corrections.length})</h3>
                <div className="space-y-2">
                  {selectedValidation.corrections.map((correction, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-sm">{correction.field_label}</p>
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-red-600">
                          <strong>Ancienne:</strong> {correction.old_value || 'Vide'}
                        </span>
                        <span>→</span>
                        <span className="text-green-600">
                          <strong>Nouvelle:</strong> {correction.new_value}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Type: {correction.anomaly_type} • Sévérité: {correction.severity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedValidation.documents.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Documents justificatifs ({selectedValidation.documents.length})</h3>
                  <div className="space-y-2">
                    {selectedValidation.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {decision === 'approved' ? 'Commentaires (optionnel)' : 'Motif du refus (obligatoire)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    decision === 'approved'
                      ? 'Ajoutez des commentaires sur cette approbation...'
                      : 'Expliquez pourquoi vous refusez cette validation...'
                  }
                  required={decision === 'rejected'}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant={decision === 'approved' ? 'success' : 'danger'}
                  onClick={handleDecision}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      {decision === 'approved' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmer l'approbation
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Confirmer le refus
                        </>
                      )}
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDecisionModal(false);
                    setComments('');
                  }}
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
