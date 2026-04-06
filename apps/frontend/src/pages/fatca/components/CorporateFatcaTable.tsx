import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, RefreshCw, Building, CheckSquare, XSquare, Clock, Save, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { db } from '@/services/db';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import apiClient from '@/lib/apiClient';
import { log } from '@/services/log';

const UsIndicator: React.FC<{ value: string | null | undefined; isUs: boolean }> = ({ value, isUs }) => {
  if (!value) return <span>-</span>;
  if (!isUs) return <span>{value}</span>;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-100 text-warning-700 font-medium">
      <Flag className="h-3 w-3" />{value}
    </span>
  );
};

const isUsCode = (code: string | null | undefined) =>
  !!code && ['US', 'USA', 'ETU', '400'].includes(code.toUpperCase());

interface FatcaClient {
  id?: number;
  clientNumber: string;
  clientName: string;
  clientType: string;
  structureCode: string;
  structureName: string;
  fatcaStatus: string;
  taxResidenceCountry: string;
  usPerson: boolean;
  usTin: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  nationality: string | null;
  usAddress: boolean;
  usPhone: boolean;
  riskLevel: string | null;
  lastReviewDate: string | null;
  indiciaTypes: string | null;
  indiciaCount: number;
  reportingRequired: boolean;
  lastScreeningDate: string | null;
  detectionSource: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  w9FormReceived: boolean;
  w8FormReceived: boolean;
  w9ReceivedDate: string | null;
  w8ReceivedDate: string | null;
}

interface CorporateFatcaTableProps {
  isLoading?: boolean;
  searchQuery: string;
  selectedStatus: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW': return 'bg-warning-100 text-warning-800';
    case 'COMPLIANT': return 'bg-success-100 text-success-800';
    case 'NON_COMPLIANT': return 'bg-error-100 text-error-800';
    case 'UNDER_INVESTIGATION': return 'bg-blue-100 text-blue-800';
    case 'EXEMPT': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW': return 'A verifier';
    case 'COMPLIANT': return 'Conforme';
    case 'NON_COMPLIANT': return 'Non conforme';
    case 'UNDER_INVESTIGATION': return 'En investigation';
    case 'EXEMPT': return 'Exempte';
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING_REVIEW': return <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />;
    case 'COMPLIANT': return <CheckSquare className="h-4 w-4 text-success-500 mr-1" />;
    case 'NON_COMPLIANT': return <XSquare className="h-4 w-4 text-error-500 mr-1" />;
    case 'UNDER_INVESTIGATION': return <Clock className="h-4 w-4 text-blue-500 mr-1" />;
    default: return null;
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('fr-FR');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateString;
  } catch { return dateString; }
};

const CorporateFatcaTable: React.FC<CorporateFatcaTableProps> = ({ isLoading = false, searchQuery, selectedStatus }) => {
  const [clients, setClients] = useState<FatcaClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<FatcaClient[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<FatcaClient | null>(null);
  const [loading, setLoading] = useState(isLoading);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const itemsPerPage = 20;
  const hasEditAccess = user?.role === 'ADMIN' || user?.role === 'AUDITOR';
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => { setCurrentPage(1); }, [selectedStatus]);
  useEffect(() => { fetchClients(); }, [currentPage, selectedStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await db.getCorporateFatcaClients(currentPage, itemsPerPage, false, selectedStatus);
      if (result.data && result.data.length > 0) {
        const clientsMap = new Map();
        result.data.forEach((c: any) => { if (!clientsMap.has(c.clientNumber)) clientsMap.set(c.clientNumber, c); });
        setClients(Array.from(clientsMap.values()));
        setTotalRecords(result.total);
        const newTotal = Math.ceil(result.total / itemsPerPage);
        if (newTotal !== totalPages) setTotalPages(newTotal);
      } else {
        setClients([]); setTotalRecords(0); setTotalPages(1);
      }
    } catch (error) {
      setError('Erreur lors du chargement des entreprises FATCA.');
      addToast('Erreur lors du chargement', 'error');
    } finally { setLoading(false); }
  };

  const computedFilteredClients = useMemo(() => {
    if (!debouncedSearch?.trim()) return clients;
    const q = debouncedSearch.toLowerCase().trim();
    return clients.filter(c =>
      c.clientNumber?.toLowerCase().includes(q) ||
      c.clientName?.toLowerCase().includes(q) ||
      c.birthCountry?.toLowerCase().includes(q) ||
      c.nationality?.toLowerCase().includes(q) ||
      c.taxResidenceCountry?.toLowerCase().includes(q) ||
      c.structureName?.toLowerCase().includes(q)
    );
  }, [clients, debouncedSearch]);

  useEffect(() => { setFilteredClients(computedFilteredClients); }, [computedFilteredClients]);

  const handleSaveClient = async () => {
    if (!editingClient) return;
    try {
      setLoading(true);
      const response = await apiClient.put(`/api/fatca/${editingClient.id}`, {
        fatcaStatus: editingClient.fatcaStatus,
        notes: editingClient.notes,
      });
      if (response.status === 200) {
        addToast('Statut FATCA mis a jour', 'success');
        await db.clearCache();
        setEditingClient(null);
        await fetchClients();
      }
    } catch (error) {
      addToast('Erreur lors de la mise a jour', 'error');
    } finally { setLoading(false); }
  };

  const displayClients = searchQuery ? filteredClients : clients;

  if (loading && clients.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-full mb-4" />
        {[...Array(5)].map((_, i) => <div key={i} className="mb-4"><div className="h-16 bg-gray-200 rounded w-full" /></div>)}
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="rounded-lg border border-error-100 p-6 bg-error-50 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-error-500 mx-auto" />
        <h3 className="text-lg font-medium text-error-800">{error}</h3>
        <Button variant="primary" onClick={fetchClients} leftIcon={<RefreshCw className="h-4 w-4" />}>Reessayer</Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <div className="inline-block min-w-full align-middle">
        {pageLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              <p className="text-primary-700">Chargement...</p>
            </div>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pays Naissance</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nationalite</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residence Fiscale</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse US</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tel. US</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">US Person</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indices</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risque</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayClients.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-medium">
                    {loading ? 'Chargement...' : selectedStatus ? `Aucune entreprise avec statut ${selectedStatus}` : searchQuery ? 'Aucun resultat' : 'Aucune entreprise FATCA detectee'}
                  </p>
                  {!loading && <Button variant="outline" size="sm" onClick={fetchClients} className="mt-2" leftIcon={<RefreshCw className="h-4 w-4" />}>Actualiser</Button>}
                </td>
              </tr>
            ) : displayClients.map(client => (
              <React.Fragment key={client.clientNumber}>
                <tr className={`hover:bg-gray-50 ${expandedRow === client.clientNumber ? 'bg-gray-50' : ''}`}>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Building className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{client.clientNumber}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{client.clientName}</div>
                        <div className="text-xs text-gray-400">{client.clientType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap"><UsIndicator value={client.birthCountry} isUs={isUsCode(client.birthCountry)} /></td>
                  <td className="px-2 py-3 whitespace-nowrap"><UsIndicator value={client.nationality} isUs={isUsCode(client.nationality)} /></td>
                  <td className="px-2 py-3 whitespace-nowrap"><UsIndicator value={client.taxResidenceCountry} isUs={isUsCode(client.taxResidenceCountry)} /></td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm">
                    {client.usAddress ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-100 text-warning-700 font-medium"><Flag className="h-3 w-3" />Oui</span> : <span className="text-gray-400">Non</span>}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm">
                    {client.usPhone ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-100 text-warning-700 font-medium"><Flag className="h-3 w-3" />Oui</span> : <span className="text-gray-400">Non</span>}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm">
                    {client.usPerson ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error-100 text-error-700 font-medium"><Flag className="h-3 w-3" />Oui</span> : <span className="text-gray-400">Non</span>}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm">
                    <span className="font-medium text-gray-900">{client.indiciaCount || 0}</span>
                    {client.indiciaTypes && <div className="text-xs text-gray-500 truncate max-w-[120px]" title={client.indiciaTypes}>{client.indiciaTypes.split(',').map(t => t.replace('_', ' ')).join(', ')}</div>}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      client.riskLevel === 'CRITICAL' ? 'bg-error-100 text-error-800' :
                      client.riskLevel === 'HIGH' ? 'bg-warning-100 text-warning-800' :
                      client.riskLevel === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>{client.riskLevel || '-'}</span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(client.fatcaStatus)}`}>
                      {getStatusIcon(client.fatcaStatus)}{getStatusLabel(client.fatcaStatus)}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setExpandedRow(expandedRow === client.clientNumber ? null : client.clientNumber)}>Voir</Button>
                      <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setExpandedRow(expandedRow === client.clientNumber ? null : client.clientNumber)}>
                        {expandedRow === client.clientNumber ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedRow === client.clientNumber && (
                  <tr className="bg-gray-50">
                    <td colSpan={11} className="px-3 py-4">
                      <div className="border-l-4 border-primary-500 pl-4 py-2">
                        {editingClient && editingClient.clientNumber === client.clientNumber ? (
                          <div className="space-y-4">
                            <span className="font-medium text-gray-900">Modifier le statut FATCA</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut FATCA</label>
                                <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                  value={editingClient.fatcaStatus}
                                  onChange={e => setEditingClient({ ...editingClient, fatcaStatus: e.target.value })}>
                                  <option value="PENDING_REVIEW">A verifier</option>
                                  <option value="COMPLIANT">Conforme</option>
                                  <option value="NON_COMPLIANT">Non conforme</option>
                                  <option value="UNDER_INVESTIGATION">En investigation</option>
                                  <option value="EXEMPT">Exempte</option>
                                </select>
                              </div>
                              <Input label="Notes" value={editingClient.notes || ''} onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })} placeholder="Notes..." />
                            </div>
                            <div className="flex space-x-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setEditingClient(null)}>Annuler</Button>
                              <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveClient}>Enregistrer</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Identification</h3>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Code client:</span><span className="text-sm font-medium">{client.clientNumber}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Nom:</span><span className="text-sm font-medium">{client.clientName || '-'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Type:</span><span className="text-sm font-medium">{client.clientType}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Agence:</span><span className="text-sm font-medium">{client.structureName || client.structureCode}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Cree le:</span><span className="text-sm font-medium">{formatDate(client.createdAt)}</span></div>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Indices US (criteres FATCA)</h3>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Pays naissance:</span><UsIndicator value={client.birthCountry} isUs={isUsCode(client.birthCountry)} /></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Lieu naissance:</span><span className="text-sm font-medium">{client.birthPlace || '-'}</span></div>
                                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Nationalite:</span><UsIndicator value={client.nationality} isUs={isUsCode(client.nationality)} /></div>
                                  <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Residence fiscale:</span><UsIndicator value={client.taxResidenceCountry} isUs={isUsCode(client.taxResidenceCountry)} /></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Adresse US:</span><span className="text-sm font-medium">{client.usAddress ? 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Telephone US:</span><span className="text-sm font-medium">{client.usPhone ? 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">US Person:</span><span className="text-sm font-medium">{client.usPerson ? 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">TIN (US):</span><span className="text-sm font-medium">{client.usTin || '-'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Types indices:</span><span className="text-sm font-medium">{client.indiciaTypes || '-'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Nb indices:</span><span className="text-sm font-medium">{client.indiciaCount || 0}</span></div>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Statut & Conformite</h3>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Statut FATCA:</span>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(client.fatcaStatus)}`}>
                                      {getStatusIcon(client.fatcaStatus)}{getStatusLabel(client.fatcaStatus)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Risque:</span><span className="text-sm font-medium">{client.riskLevel || '-'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Declaration requise:</span><span className="text-sm font-medium">{client.reportingRequired ? 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">W9 recu:</span><span className="text-sm font-medium">{client.w9FormReceived ? formatDate(client.w9ReceivedDate) || 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">W8 recu:</span><span className="text-sm font-medium">{client.w8FormReceived ? formatDate(client.w8ReceivedDate) || 'Oui' : 'Non'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Dernier screening:</span><span className="text-sm font-medium">{formatDate(client.lastScreeningDate)}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Source detection:</span><span className="text-sm font-medium">{client.detectionSource || '-'}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Derniere revue:</span><span className="text-sm font-medium">{formatDate(client.lastReviewDate)}</span></div>
                                  <div className="flex justify-between"><span className="text-sm text-gray-500">Notes:</span><span className="text-sm font-medium">{client.notes || '-'}</span></div>
                                </div>
                              </div>
                            </div>
                            {hasEditAccess && (
                              <div className="mt-4 flex justify-end">
                                <Button variant="primary" size="sm" onClick={() => { setEditingClient({ ...client }); setExpandedRow(client.clientNumber); }}>Modifier le statut</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
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
            onPageChange={(p) => { setPageLoading(true); setCurrentPage(p); setExpandedRow(null); setEditingClient(null); setPageLoading(false); }}
            isLoading={loading || pageLoading}
            summaryText={`Affichage de ${((currentPage - 1) * itemsPerPage + 1).toLocaleString('fr-FR')} - ${Math.min(currentPage * itemsPerPage, totalRecords).toLocaleString('fr-FR')} sur ${totalRecords.toLocaleString('fr-FR')} entreprises FATCA${selectedStatus ? ` avec statut ${selectedStatus}` : ''}`}
          />
        </div>
      )}
    </div>
  );
};

export default CorporateFatcaTable;
