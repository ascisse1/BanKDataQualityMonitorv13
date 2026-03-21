import { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, XCircle, GitMerge, RefreshCw, Play } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { duplicateDetectionService, DuplicateCandidate } from '../../services/duplicateDetectionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toaster';

const DuplicatesPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'corporate'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCandidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    high_confidence: 0,
  });

  useEffect(() => {
    loadDuplicates();
    loadStats();
  }, [filterType]);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterType !== 'all') filters.client_type = filterType;

      const data = await duplicateDetectionService.getPendingDuplicates(filters);
      setDuplicates(data);
    } catch (error) {
      console.error('Error loading duplicates:', error);
      addToast('Erreur lors du chargement des doublons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await duplicateDetectionService.getDuplicateStats();
    if (statsData) {
      setStats({
        total: statsData.total_duplicates,
        pending: statsData.pending_review,
        confirmed: statsData.confirmed,
        high_confidence: statsData.high_confidence,
      });
    }
  };

  const runDetection = async () => {
    if (!user) return;

    try {
      setIsDetecting(true);
      addToast('Détection des doublons en cours...', 'info');

      const result = await duplicateDetectionService.runDuplicateDetection('individual', 1000);

      addToast(
        `Détection terminée: ${result.detected} doublons détectés sur ${result.processed} clients analysés`,
        'success'
      );

      await loadDuplicates();
      await loadStats();
    } catch (error) {
      console.error('Error running detection:', error);
      addToast('Erreur lors de la détection des doublons', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = async (duplicate: DuplicateCandidate) => {
    if (!user) return;

    try {
      const success = await duplicateDetectionService.confirmDuplicate(
        duplicate.id,
        user.id,
        'Doublon confirmé par revue manuelle'
      );

      if (success) {
        addToast('Doublon confirmé avec succès', 'success');
        await loadDuplicates();
        await loadStats();
      } else {
        addToast('Erreur lors de la confirmation', 'error');
      }
    } catch (error) {
      console.error('Error confirming duplicate:', error);
      addToast('Erreur lors de la confirmation', 'error');
    }
  };

  const handleReject = async (duplicate: DuplicateCandidate) => {
    if (!user) return;

    try {
      const success = await duplicateDetectionService.rejectDuplicate(
        duplicate.id,
        user.id,
        'Clients différents après vérification'
      );

      if (success) {
        addToast('Doublon rejeté avec succès', 'success');
        await loadDuplicates();
        await loadStats();
      } else {
        addToast('Erreur lors du rejet', 'error');
      }
    } catch (error) {
      console.error('Error rejecting duplicate:', error);
      addToast('Erreur lors du rejet', 'error');
    }
  };

  const filteredDuplicates = duplicates.filter((dup) => {
    if (filterConfidence === 'all') return true;

    const confidence = duplicateDetectionService.getConfidenceLevel(dup.similarity_score);

    if (filterConfidence === 'high') return confidence.level === 'very_high' || confidence.level === 'high';
    if (filterConfidence === 'medium') return confidence.level === 'medium';
    if (filterConfidence === 'low') return confidence.level === 'low';

    return true;
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
          <h1 className="text-3xl font-bold text-gray-900">Détection de Doublons</h1>
          <p className="mt-1 text-gray-600">Identification et gestion des clients en doublon</p>
        </div>
        <Button
          variant="primary"
          onClick={runDetection}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Détection en cours...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Lancer la détection
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Doublons</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">En Attente</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Confirmés</p>
              <p className="text-3xl font-bold text-green-900">{stats.confirmed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Haute Confiance</p>
              <p className="text-3xl font-bold text-red-900">{stats.high_confidence}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les types</option>
          <option value="individual">Particuliers</option>
          <option value="corporate">Entreprises</option>
        </select>

        <select
          value={filterConfidence}
          onChange={(e) => setFilterConfidence(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les confiances</option>
          <option value="high">Haute confiance</option>
          <option value="medium">Confiance moyenne</option>
          <option value="low">Faible confiance</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confiance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Champs Correspondants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDuplicates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun doublon détecté</p>
                  </td>
                </tr>
              ) : (
                filteredDuplicates.map((duplicate) => {
                  const confidence = duplicateDetectionService.getConfidenceLevel(
                    duplicate.similarity_score
                  );
                  return (
                    <tr key={duplicate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full text-${confidence.color}-600 bg-${confidence.color}-100`}
                          >
                            {duplicate.similarity_score}%
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {confidence.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {duplicate.client_name_1}
                        </div>
                        <div className="text-xs text-gray-500">{duplicate.client_id_1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {duplicate.client_name_2}
                        </div>
                        <div className="text-xs text-gray-500">{duplicate.client_id_2}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {duplicateDetectionService.formatMatchingFields(duplicate.matching_fields)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {duplicate.client_type === 'individual' ? 'Particulier' : 'Entreprise'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConfirm(duplicate)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmer
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(duplicate)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedDuplicate(duplicate);
                              setShowDetailModal(true);
                            }}
                          >
                            <GitMerge className="w-4 h-4 mr-1" />
                            Fusionner
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DuplicatesPage;
