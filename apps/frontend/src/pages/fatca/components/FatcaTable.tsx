import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, RefreshCw, User, CheckSquare, XSquare, Clock, Save, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { db } from '@/services/db';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import apiClient from '@/lib/apiClient';
import { log } from '@/services/log';

/** Renders a US indicator badge with icon + text (accessible, not color-only) */
const UsIndicator: React.FC<{ value: string | null; isUs: boolean }> = ({ value, isUs }) => {
  if (!value) return <span>-</span>;
  if (!isUs) return <span>{value}</span>;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 font-medium" aria-label={`${value} - Indice d'américanité`}>
      <Flag className="h-3 w-3" aria-hidden="true" />
      {value}
    </span>
  );
};

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
  nextReviewDate: string | null;
  indiciaTypes: string | null;
  indiciaCount: number;
  reportingRequired: boolean;
  w9FormReceived: boolean;
  w8FormReceived: boolean;
  w9ReceivedDate: string | null;
  w8ReceivedDate: string | null;
  w9ExpiryDate: string | null;
  w8ExpiryDate: string | null;
  declarationDate: string | null;
  documentStatus: string | null;
  documentNotes: string | null;
  lastScreeningDate: string | null;
  detectionSource: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface FatcaTableProps {
  isLoading?: boolean;
  searchQuery: string;
  selectedStatus: string | null;
}

const FatcaTable: React.FC<FatcaTableProps> = ({ 
  isLoading = false, 
  searchQuery, 
  selectedStatus 
}) => {
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

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  // Fetch clients when page or status changes
  useEffect(() => {
    fetchClients();
  }, [currentPage, selectedStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      log.debug('api', 'Fetching FATCA clients', { page: currentPage, status: selectedStatus });
      
      const result = await db.getFatcaClients(currentPage, itemsPerPage, false, selectedStatus, '1');
      
      if (result.data && result.data.length > 0) {
        log.debug('api', 'Retrieved FATCA client records', { count: result.data.length });
        
        // Create a Map to deduplicate clients by cli
        const clientsMap = new Map();
        result.data.forEach(client => {
          // Only add if not already in the map or replace with better data
          if (!clientsMap.has(client.clientNumber)) {
            clientsMap.set(client.clientNumber, client);
          }
        });
        
        // Convert Map back to array
        const uniqueClients = Array.from(clientsMap.values());
        log.debug('api', 'After deduplication', { uniqueCount: uniqueClients.length });
        
        setClients(uniqueClients);
        setTotalRecords(result.total);
        
        // Only update totalPages if it's different to avoid unnecessary re-renders
        const newTotalPages = Math.ceil(result.total / itemsPerPage);
        if (newTotalPages !== totalPages) {
          setTotalPages(newTotalPages);
        }
      } else {
        log.debug('api', 'No FATCA client records found');
        setClients([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      setError('Erreur lors du chargement des clients FATCA. Veuillez réessayer.');
      log.error('api', 'Error fetching FATCA clients', { error });
      addToast('Erreur lors du chargement des clients FATCA', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtering with debounced search
  const computedFilteredClients = useMemo(() => {
    if (!debouncedSearch || !debouncedSearch.trim()) return clients;
    const query = debouncedSearch.toLowerCase().trim();
    return clients.filter(client =>
      client.clientNumber?.toLowerCase().includes(query) ||
      client.clientName?.toLowerCase().includes(query) ||
      client.birthCountry?.toLowerCase().includes(query) ||
      client.nationality?.toLowerCase().includes(query) ||
      client.taxResidenceCountry?.toLowerCase().includes(query) ||
      client.structureCode?.toLowerCase().includes(query) ||
      client.usTin?.toLowerCase().includes(query)
    );
  }, [clients, debouncedSearch]);

  useEffect(() => {
    setFilteredClients(computedFilteredClients);
  }, [computedFilteredClients]);

  const toggleExpandRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleEditClient = (client: FatcaClient) => {
    setEditingClient({...client});
    setExpandedRow(client.clientNumber);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;
    
    try {
      setLoading(true);
      
      // Call API to update client status (uses session cookies + CSRF automatically)
      const response = await apiClient.put(`/api/fatca/${editingClient.id}`, {
        fatcaStatus: editingClient.fatcaStatus,
        notes: editingClient.notes,
        username: user?.username
      });

      if (response.status === 200) {
        addToast('Statut FATCA mis à jour avec succès', 'success');
        
        // Update local state
        setClients(prevClients => 
          prevClients.map(client => 
            client.clientNumber === editingClient.clientNumber 
              ? {
                  ...client,
                  fatcaStatus: editingClient.fatcaStatus,
                  lastReviewDate: new Date().toISOString().split('T')[0],
                  notes: editingClient.notes
                }
              : client
          )
        );
        
        // Clear cache to ensure fresh data on next fetch
        await db.clearCache();
        
        // Reset editing state
        setEditingClient(null);
      }
    } catch (error) {
      log.error('api', 'Error updating FATCA status', { error });
      const axiosError = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      const message = axiosError || (error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut FATCA');
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-warning-100 text-warning-800';
      case 'COMPLIANT':
        return 'bg-success-100 text-success-800';
      case 'NON_COMPLIANT':
        return 'bg-error-100 text-error-800';
      case 'UNDER_INVESTIGATION':
        return 'bg-blue-100 text-blue-800';
      case 'EXEMPT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'À vérifier';
      case 'COMPLIANT': return 'Conforme';
      case 'NON_COMPLIANT': return 'Non conforme';
      case 'UNDER_INVESTIGATION': return 'En investigation';
      case 'EXEMPT': return 'Exempté';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />;
      case 'COMPLIANT':
        return <CheckSquare className="h-4 w-4 text-success-500 mr-1" />;
      case 'NON_COMPLIANT':
        return <XSquare className="h-4 w-4 text-error-500 mr-1" />;
      case 'UNDER_INVESTIGATION':
        return <Clock className="h-4 w-4 text-blue-500 mr-1" />;
      case 'EXEMPT':
        return <Clock className="h-4 w-4 text-gray-500 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    try {
      // Check if it's already in DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      
      // Check if it's in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Handle ISO format
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('fr-FR');
        }
      }
      
      // Handle unusual format like "09T00:00:00.000Z/05/2002"
      if (dateString.includes('/') && dateString.includes('T')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Assuming format is day/month/year
          return `${parts[0].split('T')[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
      }
      
      // If all else fails, return the original string
      return dateString;
    } catch (error) {
      log.error('system', 'Error formatting date', { error });
      return dateString;
    }
  };

  const handlePageChange = (page: number) => {
    log.debug('ui', `Changing to page ${page}`);
    setPageLoading(true);
    setCurrentPage(page);
    setExpandedRow(null);
    setEditingClient(null);
    
    setPageLoading(false);
  };

  // Use filtered clients for display, but fall back to all clients if filtering hasn't been applied yet
  const displayClients = searchQuery ? filteredClients : clients;

  if (loading && clients.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="rounded-lg border border-error-100 p-6 bg-error-50">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-error-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-error-800">{error}</h3>
            <p className="text-sm text-error-600">Veuillez réessayer ultérieurement.</p>
          </div>
          <Button
            variant="primary"
            onClick={fetchClients}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <div className="inline-block min-w-full align-middle">
        {pageLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <p className="text-primary-700">Chargement de la page {currentPage}...</p>
            </div>
          </div>
        )}
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays Naissance</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu Naissance</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationalité</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Résidence Fiscale</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse US</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tél. US</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">US Person</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indices</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risque</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayClients.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-lg font-medium">
                      {loading ? 'Chargement des clients FATCA...' :
                       selectedStatus ? `Aucun client FATCA avec le statut ${selectedStatus}` :
                       searchQuery ? 'Aucun client FATCA trouvé pour cette recherche' :
                       'Aucun client FATCA détecté'
                      }
                    </p>
                    <p className="text-sm">
                      {!loading && displayClients.length === 0 && (searchQuery || selectedStatus) && 
                       'Essayez de modifier vos critères de recherche'
                      }
                    </p>
                    {!loading && displayClients.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchClients}
                        className="mt-2"
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                      >
                        Actualiser
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayClients.map((client) => (
                <React.Fragment key={client.clientNumber}>
                  <tr className={`hover:bg-gray-50 ${expandedRow === client.clientNumber ? 'bg-gray-50' : ''}`}>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{client.clientNumber}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{client.clientName}</div>
                          <div className="text-xs text-gray-400">{client.clientType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <UsIndicator value={client.birthCountry} isUs={['US', 'USA', 'ETU', '400'].includes(client.birthCountry?.toUpperCase() || '')} />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                      {client.birthPlace || '-'}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <UsIndicator value={client.nationality} isUs={['US', 'USA', 'ETU', '400'].includes(client.nationality?.toUpperCase() || '')} />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <UsIndicator value={client.taxResidenceCountry} isUs={['US', 'USA', 'ETU', '400'].includes(client.taxResidenceCountry?.toUpperCase() || '')} />
                    </td>
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
                      {client.indiciaTypes && (
                        <div className="text-xs text-gray-500 truncate max-w-[120px]" title={client.indiciaTypes}>
                          {client.indiciaTypes.split(',').map(t => t.replace('_', ' ')).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        client.riskLevel === 'CRITICAL' ? 'bg-error-100 text-error-800' :
                        client.riskLevel === 'HIGH' ? 'bg-warning-100 text-warning-800' :
                        client.riskLevel === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{client.riskLevel || '-'}</span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(client.fatcaStatus)}`}>
                        {getStatusIcon(client.fatcaStatus)}
                        {getStatusLabel(client.fatcaStatus)}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => toggleExpandRow(client.clientNumber)}>Voir</Button>
                        <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => toggleExpandRow(client.clientNumber)}>
                          {expandedRow === client.clientNumber ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === client.clientNumber && (
                    <tr className="bg-gray-50">
                      <td colSpan={12} className="px-3 py-4">
                        <div className="border-l-4 border-primary-500 pl-4 py-2">
                          {editingClient && editingClient.clientNumber === client.clientNumber ? (
                            <div className="space-y-4">
                              <div>
                                <span className="font-medium text-gray-900">Modifier le statut FATCA</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut FATCA
                                  </label>
                                  <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={editingClient.fatcaStatus}
                                    onChange={(e) => setEditingClient({...editingClient, fatcaStatus: e.target.value})}
                                  >
                                    <option value="PENDING_REVIEW">À vérifier</option>
                                    <option value="COMPLIANT">Conforme</option>
                                    <option value="NON_COMPLIANT">Non conforme</option>
                                    <option value="UNDER_INVESTIGATION">En investigation</option>
                                    <option value="EXEMPT">Exempté</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <Input
                                    label="Notes"
                                    value={editingClient.notes || ''}
                                    onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                                    placeholder="Ajouter des notes sur ce client FATCA..."
                                  />
                                </div>
                              </div>
                              
                              <div className="flex space-x-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<Save className="h-4 w-4" />}
                                  onClick={handleSaveClient}
                                >
                                  Enregistrer
                                </Button>
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
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Créé le:</span><span className="text-sm font-medium">{formatDate(client.createdAt)}</span></div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">Indices US (critères FATCA)</h3>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Pays de naissance:</span><UsIndicator value={client.birthCountry} isUs={['US','USA','ETU','400'].includes(client.birthCountry?.toUpperCase() || '')} /></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Lieu de naissance:</span><span className="text-sm font-medium">{client.birthPlace || '-'}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Nationalité:</span><UsIndicator value={client.nationality} isUs={['US','USA','ETU','400'].includes(client.nationality?.toUpperCase() || '')} /></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Résidence fiscale:</span><UsIndicator value={client.taxResidenceCountry} isUs={['US','USA','ETU','400'].includes(client.taxResidenceCountry?.toUpperCase() || '')} /></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Adresse US:</span><span className="text-sm font-medium">{client.usAddress ? 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Téléphone US:</span><span className="text-sm font-medium">{client.usPhone ? 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">US Person:</span><span className="text-sm font-medium">{client.usPerson ? 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">TIN (US):</span><span className="text-sm font-medium">{client.usTin || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Types d'indices:</span><span className="text-sm font-medium">{client.indiciaTypes || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Nombre d'indices:</span><span className="text-sm font-medium">{client.indiciaCount || 0}</span></div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">Statut & Conformité</h3>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Statut FATCA:</span>
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(client.fatcaStatus)}`}>
                                        {getStatusIcon(client.fatcaStatus)}{getStatusLabel(client.fatcaStatus)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Niveau de risque:</span><span className="text-sm font-medium">{client.riskLevel || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Déclaration requise:</span><span className="text-sm font-medium">{client.reportingRequired ? 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">W9 reçu:</span><span className="text-sm font-medium">{client.w9FormReceived ? formatDate(client.w9ReceivedDate) || 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">W8 reçu:</span><span className="text-sm font-medium">{client.w8FormReceived ? formatDate(client.w8ReceivedDate) || 'Oui' : 'Non'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Dernier screening:</span><span className="text-sm font-medium">{formatDate(client.lastScreeningDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Source détection:</span><span className="text-sm font-medium">{client.detectionSource || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Dernière revue:</span><span className="text-sm font-medium">{formatDate(client.lastReviewDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Prochaine revue:</span><span className="text-sm font-medium">{formatDate(client.nextReviewDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Notes:</span><span className="text-sm font-medium">{client.notes || '-'}</span></div>
                                  </div>
                                </div>
                              </div>
                              
                              {hasEditAccess && (
                                <div className="mt-4 flex justify-end">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    Modifier le statut
                                  </Button>
                                </div>
                              )}
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
      
      {totalRecords > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            isLoading={loading || pageLoading}
            summaryText={`Affichage de ${((currentPage - 1) * itemsPerPage + 1).toLocaleString('fr-FR')} - ${Math.min(currentPage * itemsPerPage, totalRecords).toLocaleString('fr-FR')} sur ${totalRecords.toLocaleString('fr-FR')} clients FATCA${selectedStatus ? ` avec statut ${selectedStatus}` : ''}`}
          />
        </div>
      )}
    </div>
  );
};

export default FatcaTable;