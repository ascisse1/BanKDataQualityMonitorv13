import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, RefreshCw, User, Building, Edit, Users, FileWarning } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import AnomalyCorrection from './AnomalyCorrection';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import { useAuth } from '../../../context/AuthContext';
import { log } from '../../../services/log';
import { useDebounce } from '../../../hooks/useDebounce';

interface Anomaly {
  cli: string;
  nom: string;
  pre?: string;
  prenom?: string;
  tcli: string;
  age?: string;
  status: string;
  severity?: string;
  field?: string;
  fieldCode?: string;
  errorType?: string;
  errorMessage?: string;
  nmer?: string;
  dna?: string;
  nid?: string;
  nat?: string;
  nrc?: string;
  datc?: string;
  rso?: string;
  email?: string;
  telephone?: string;
  [key: string]: any;
}

interface GroupedClient {
  cli: string;
  nom: string;
  pre?: string;
  prenom?: string;
  tcli: string;
  age?: string;
  anomalies: Anomaly[];
  anomalyCount: number;
  highestSeverity: string;
  statuses: string[];
}

interface AnomaliesTableProps {
  isLoading?: boolean;
  selectedAgency: string | null;
  searchTerm: string;
  selectedClientType?: string;
  selectedStatus?: string;
  totalAnomalies: number;
}

const AnomaliesTable: React.FC<AnomaliesTableProps> = ({
  selectedAgency,
  searchTerm,
  selectedClientType = 'all',
  selectedStatus = 'all',
  totalAnomalies
}) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [paginationKey, setPaginationKey] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.ceil(totalAnomalies / 10));
  const [totalRecords, setTotalRecords] = useState(totalAnomalies);
  const [editingAnomaly, setEditingAnomaly] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isAgencyUser = user?.role === 'AGENCY_USER';
  const userAgencyCode = user?.agencyCode;
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Group anomalies by client
  const groupedClients = useMemo((): GroupedClient[] => {
    const clientMap = new Map<string, GroupedClient>();

    anomalies.forEach((anomaly) => {
      const cli = anomaly.cli;
      if (!clientMap.has(cli)) {
        clientMap.set(cli, {
          cli,
          nom: anomaly.nom,
          pre: anomaly.pre || anomaly.prenom,
          prenom: anomaly.prenom,
          tcli: anomaly.tcli,
          age: anomaly.age,
          anomalies: [],
          anomalyCount: 0,
          highestSeverity: 'Faible',
          statuses: [],
        });
      }

      const client = clientMap.get(cli)!;
      client.anomalies.push(anomaly);
      client.anomalyCount++;

      // Track highest severity
      const severityOrder = { 'Critique': 4, 'Haute': 3, 'Moyenne': 2, 'Faible': 1 };
      const currentSeverity = anomaly.severity || 'Haute';
      if ((severityOrder[currentSeverity as keyof typeof severityOrder] || 0) >
          (severityOrder[client.highestSeverity as keyof typeof severityOrder] || 0)) {
        client.highestSeverity = currentSeverity;
      }

      // Track unique statuses
      if (anomaly.status && !client.statuses.includes(anomaly.status)) {
        client.statuses.push(anomaly.status);
      }
    });

    return Array.from(clientMap.values());
  }, [anomalies]);

  const fetchAnomaliesFromBackend = async () => {
    try {
      setPageLoading(true);
      setError(null);

      // Build params for API call
      const params: Record<string, any> = {};

      // Filtrage par agence
      if (selectedAgency) {
        params.agencyCode = selectedAgency;
      } else if (isAgencyUser && userAgencyCode) {
        params.agencyCode = userAgencyCode;
      }

      // Filtrage par statut
      if (selectedStatus && selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // Server-side search
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // Get data based on client type
      let result;
      if (selectedClientType === '2') {
        result = await db.getCorporateAnomalies(currentPage, itemsPerPage, false, params);
      } else if (selectedClientType === '3') {
        result = await db.getInstitutionalAnomalies(currentPage, itemsPerPage, false, params);
      } else if (selectedClientType === '1') {
        result = await db.getIndividualAnomalies(currentPage, itemsPerPage, false, params);
      } else {
        result = await db.getAllAnomalies(currentPage, itemsPerPage, false, params);
      }

      const anomaliesData = result.data || [];

      setAnomalies(anomaliesData);
      setTotalRecords(result.total || anomaliesData.length);
      setTotalPages(Math.ceil((result.total || anomaliesData.length) / itemsPerPage));
    } catch (error) {
      log.error('api', 'Erreur lors du chargement des anomalies', { error });
      setError('Erreur lors du chargement des anomalies');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAgency, debouncedSearch, selectedStatus, selectedClientType]);

  useEffect(() => {
    setExpandedRow(null);
    setEditingAnomaly(null);
    fetchAnomaliesFromBackend();
  }, [selectedAgency, debouncedSearch, selectedStatus, selectedClientType, currentPage, userAgencyCode, paginationKey]);

  const toggleExpandRow = (cli: string) => {
    setExpandedRow(expandedRow === cli ? null : cli);
    setExpandedAnomaly(null); // Reset anomaly detail when collapsing client
  };

  const toggleExpandAnomaly = (anomalyKey: string) => {
    setExpandedAnomaly(expandedAnomaly === anomalyKey ? null : anomalyKey);
  };

  const getAnomalyKey = (cli: string, index: number) => `${cli}-${index}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
      case 'Nouveau':
        return 'bg-yellow-100 text-yellow-800';
      case 'En cours':
      case 'En revue':
        return 'bg-blue-100 text-blue-800';
      case 'Résolu':
      case 'Corrigé':
        return 'bg-green-100 text-green-800';
      case 'Rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Haute':
        return 'bg-error-100 text-error-800';
      case 'Moyenne':
        return 'bg-warning-100 text-warning-800';
      case 'Faible':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldName = (anomaly: any) => {
    return anomaly.field || 'Inconnu';
  };

  const getFieldCode = (anomaly: any) => {
    return anomaly.fieldCode || '';
  };

  const getFieldValue = (anomaly: any) => {
    return anomaly.currentValue || '';
  };

  const getErrorMessage = (anomaly: any) => {
    return anomaly.errorMessage || 'Erreur non spécifiée';
  };

  const handlePageChange = (page: number) => {
    log.debug('ui', `Changing to page ${page}`);
    setPageLoading(true);
    setExpandedRow(null);
    setEditingAnomaly(null);
    setCurrentPage(page);
    setPaginationKey(prev => prev + 1); // Force re-render with new data

    // Simulate a delay for the loading animation
    setTimeout(() => {
      setPageLoading(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Chargement des anomalies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAnomaliesFromBackend} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      {/* Modal pour la correction d'anomalie */}
      {editingAnomaly && !expandedRow && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Correction d'anomalie</h2>
            <AnomalyCorrection
              key={`${editingAnomaly.cli}-${editingAnomaly.fieldCode}`}
              anomaly={editingAnomaly}
              onCorrectionComplete={async () => {
                setEditingAnomaly(null);
                await db.clearCache();
                fetchAnomaliesFromBackend();
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingAnomaly(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="inline-block min-w-full align-middle">
        {pageLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement...</p>
            </div>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anomalies
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sévérité max
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statuts
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Aucune anomalie trouvée</p>
                  <p className="text-gray-400 mt-1">
                    {searchTerm || selectedStatus !== 'all' || selectedClientType !== 'all' || selectedAgency
                      ? 'Essayez de modifier vos filtres de recherche'
                      : 'Toutes les données client sont conformes'}
                  </p>
                </td>
              </tr>
            ) : (
              groupedClients.map((client) => (
                <React.Fragment key={client.cli}>
                  {/* Client row */}
                  <tr className={`hover:bg-gray-50 ${expandedRow === client.cli ? 'bg-primary-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${client.tcli === '1' ? 'bg-primary-100' : client.tcli === '2' ? 'bg-secondary-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            {client.tcli === '1' ? (
                              <User className="h-5 w-5 text-primary-600" />
                            ) : client.tcli === '2' ? (
                              <Building className="h-5 w-5 text-secondary-600" />
                            ) : (
                              <Users className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.nom} {client.pre || client.prenom || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            CLI: {client.cli} {client.age && `| Agence: ${client.age}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          client.anomalyCount >= 3 ? 'bg-error-100 text-error-700' :
                          client.anomalyCount === 2 ? 'bg-warning-100 text-warning-700' :
                          'bg-gray-100 text-gray-700'
                        } font-semibold text-sm`}>
                          {client.anomalyCount}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          anomalie{client.anomalyCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(client.highestSeverity)}`}>
                        {client.highestSeverity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {client.statuses.slice(0, 2).map((status, idx) => (
                          <span key={idx} className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        ))}
                        {client.statuses.length > 2 && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            +{client.statuses.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant={expandedRow === client.cli ? 'primary' : 'ghost'}
                          size="sm"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => toggleExpandRow(client.cli)}
                        >
                          {expandedRow === client.cli ? 'Masquer' : 'Détails'}
                        </Button>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => toggleExpandRow(client.cli)}
                        >
                          {expandedRow === client.cli ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded client anomalies */}
                  {expandedRow === client.cli && (
                    <tr>
                      <td colSpan={5} className="px-0 py-0">
                        <div className="bg-gray-50 border-l-4 border-primary-500">
                          {/* Client summary header */}
                          <div className="px-6 py-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                  <FileWarning className="h-5 w-5 text-warning-500" />
                                  {client.anomalyCount} anomalie{client.anomalyCount > 1 ? 's' : ''} détectée{client.anomalyCount > 1 ? 's' : ''}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Client: {client.nom} {client.pre || ''} (CLI: {client.cli})
                                  {client.tcli === '1' && ' - Particulier'}
                                  {client.tcli === '2' && ' - Entreprise'}
                                  {client.tcli === '3' && ' - Institutionnel'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Type de client</div>
                                <div className="flex items-center gap-1 text-sm font-medium mt-1">
                                  {client.tcli === '1' ? (
                                    <>
                                      <User className="h-4 w-4 text-primary-600" />
                                      <span>Particulier</span>
                                    </>
                                  ) : client.tcli === '2' ? (
                                    <>
                                      <Building className="h-4 w-4 text-secondary-600" />
                                      <span>Entreprise</span>
                                    </>
                                  ) : (
                                    <>
                                      <Users className="h-4 w-4 text-gray-600" />
                                      <span>Institutionnel</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* List of anomalies for this client */}
                          <div className="divide-y divide-gray-200">
                            {client.anomalies.map((anomaly, index) => {
                              const anomalyKey = getAnomalyKey(client.cli, index);
                              const isAnomalyExpanded = expandedAnomaly === anomalyKey;

                              return (
                                <div key={anomalyKey} className="bg-white hover:bg-gray-50">
                                  {/* Anomaly row */}
                                  <div className="px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className={`h-4 w-4 ${
                                          anomaly.severity === 'Critique' || anomaly.severity === 'Haute'
                                            ? 'text-error-500'
                                            : 'text-warning-500'
                                        }`} />
                                        <span className="text-sm font-medium text-gray-900">
                                          {getFieldName(anomaly)}
                                        </span>
                                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                          {getFieldCode(anomaly)}
                                        </code>
                                      </div>
                                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(anomaly.severity || 'Haute')}`}>
                                        {anomaly.severity || 'Haute'}
                                      </span>
                                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(anomaly.status)}`}>
                                        {anomaly.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!['CLOSED', 'CORRECTED', 'VALIDATED'].includes(anomaly.rawStatus?.toUpperCase?.() || '') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<Edit className="h-3 w-3" />}
                                        onClick={() => setEditingAnomaly({
                                          cli: anomaly.cli,
                                          field: getFieldName(anomaly),
                                          fieldCode: getFieldCode(anomaly),
                                          currentValue: getFieldValue(anomaly),
                                          errorMessage: getErrorMessage(anomaly)
                                        })}
                                      >
                                        Corriger
                                      </Button>
                                      )}
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                        onClick={() => toggleExpandAnomaly(anomalyKey)}
                                      >
                                        {isAnomalyExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expanded anomaly details */}
                                  {isAnomalyExpanded && (
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                      {editingAnomaly && editingAnomaly.cli === anomaly.cli && editingAnomaly.fieldCode === getFieldCode(anomaly) ? (
                                        <AnomalyCorrection
                                          key={`inline-${editingAnomaly.cli}-${editingAnomaly.fieldCode}`}
                                          anomaly={editingAnomaly}
                                          onCorrectionComplete={async () => {
                                            setEditingAnomaly(null);
                                            await db.clearCache();
                                            fetchAnomaliesFromBackend();
                                          }}
                                        />
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-gray-700">Détails de l'anomalie</h4>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Champ concerné:</span>
                                                <span className="text-sm font-medium">{getFieldName(anomaly)} ({getFieldCode(anomaly)})</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Valeur actuelle:</span>
                                                <span className="text-sm font-medium text-error-600">{getFieldValue(anomaly) || '<vide>'}</span>
                                              </div>
                                              {anomaly.correctionValue && (
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Valeur corrigée:</span>
                                                  <span className="text-sm font-medium text-success-600">{anomaly.correctionValue}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Type d'erreur:</span>
                                                <span className="text-sm font-medium">{anomaly.errorType || 'Valeur manquante'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-gray-700">Message d'erreur</h4>
                                            <p className="text-sm text-error-600 bg-error-50 p-3 rounded-lg border border-error-100">
                                              {anomaly.errorMessage || getErrorMessage(anomaly)}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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

      {totalRecords > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            isLoading={loading || pageLoading}
            summaryText={`${groupedClients.length} client${groupedClients.length > 1 ? 's' : ''} avec ${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''} au total${selectedAgency ? ` pour l'agence ${selectedAgency}` : ''}${isAgencyUser && userAgencyCode ? ` pour votre agence ${userAgencyCode}` : ''}`}
          />
        </div>
      )}
    </div>
  );
};

export default AnomaliesTable;
