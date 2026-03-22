import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, RefreshCw, User, CheckSquare, XSquare, Clock, Save, Flag } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import apiClient from '../../../lib/apiClient';

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
  cli: string;
  nom: string;
  date_entree_relation: string;
  status_client: string;
  pays_naissance: string;
  nationalite: string;
  adresse: string;
  pays_adresse: string;
  telephone: string;
  relation_client: string;
  type_relation: string;
  fatca_status: string;
  fatca_date: string | null;
  fatca_uti: string | null;
  notes: string | null;
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
      console.log('🔄 Fetching FATCA clients...', { page: currentPage, status: selectedStatus });
      
      const result = await db.getFatcaClients(currentPage, itemsPerPage, false, selectedStatus, '1');
      
      if (result.data && result.data.length > 0) {
        console.log(`✅ Retrieved ${result.data.length} FATCA client records`);
        
        // Create a Map to deduplicate clients by cli
        const clientsMap = new Map();
        result.data.forEach(client => {
          // Only add if not already in the map or replace with better data
          if (!clientsMap.has(client.cli) || 
              (clientsMap.has(client.cli) && !clientsMap.get(client.cli).telephone && client.telephone)) {
            clientsMap.set(client.cli, client);
          }
        });
        
        // Convert Map back to array
        const uniqueClients = Array.from(clientsMap.values());
        console.log(`✅ After deduplication: ${uniqueClients.length} unique clients`);
        
        setClients(uniqueClients);
        setTotalRecords(result.total);
        
        // Only update totalPages if it's different to avoid unnecessary re-renders
        const newTotalPages = Math.ceil(result.total / itemsPerPage);
        if (newTotalPages !== totalPages) {
          setTotalPages(newTotalPages);
        }
      } else {
        console.log(`⚠️ No FATCA client records found`);
        setClients([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      setError('Erreur lors du chargement des clients FATCA. Veuillez réessayer.');
      console.error('❌ Error fetching FATCA clients:', error);
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
      client.cli?.toLowerCase().includes(query) ||
      client.nom?.toLowerCase().includes(query) ||
      client.pays_naissance?.toLowerCase().includes(query) ||
      client.nationalite?.toLowerCase().includes(query) ||
      client.pays_adresse?.toLowerCase().includes(query) ||
      client.telephone?.toLowerCase().includes(query)
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
    setExpandedRow(client.cli);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;
    
    try {
      setLoading(true);
      
      // Call API to update client status (uses session cookies + CSRF automatically)
      const response = await apiClient.put(`/api/fatca/clients/${editingClient.cli}`, {
        fatcaStatus: editingClient.fatca_status,
        notes: editingClient.notes,
        username: user?.username
      });

      if (response.status === 200) {
        addToast('Statut FATCA mis à jour avec succès', 'success');
        
        // Update local state
        setClients(prevClients => 
          prevClients.map(client => 
            client.cli === editingClient.cli 
              ? {
                  ...client,
                  fatca_status: editingClient.fatca_status,
                  fatca_date: new Date().toISOString().split('T')[0],
                  fatca_uti: user?.username || 'system',
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
    } catch (error: any) {
      console.error('Error updating FATCA status:', error);
      const message = error?.response?.data?.error || 'Erreur lors de la mise à jour du statut FATCA';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À vérifier':
        return 'bg-warning-100 text-warning-800';
      case 'Confirmé':
        return 'bg-success-100 text-success-800';
      case 'Exclu':
        return 'bg-error-100 text-error-800';
      case 'En attente':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'À vérifier':
        return <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />;
      case 'Confirmé':
        return <CheckSquare className="h-4 w-4 text-success-500 mr-1" />;
      case 'Exclu':
        return <XSquare className="h-4 w-4 text-error-500 mr-1" />;
      case 'En attente':
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
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
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
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Entrée
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pays Naissance
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nationalité
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pays Adresse
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut FATCA
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date FATCA
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
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
                <React.Fragment key={`${client.cli}-${client.telephone}`}>
                  <tr className={`hover:bg-gray-50 ${expandedRow === client.cli ? 'bg-gray-50' : ''}`}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{client.cli}</div>
                          <div className="text-xs text-gray-500">
                            {client.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {client.status_client}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(client.date_entree_relation)}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <UsIndicator value={client.pays_naissance} isUs={client.pays_naissance === 'US'} />
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <UsIndicator value={client.nationalite} isUs={client.nationalite === 'US'} />
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <UsIndicator value={client.pays_adresse} isUs={client.pays_adresse === 'US'} />
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <UsIndicator value={client.telephone} isUs={!!client.telephone && client.telephone.startsWith('+1')} />
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(
                          client.fatca_status
                        )}`}
                      >
                        {getStatusIcon(client.fatca_status)}
                        {client.fatca_status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.fatca_date)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => toggleExpandRow(client.cli)}
                        >
                          Voir
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
                  {expandedRow === client.cli && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-3 py-4">
                        <div className="border-l-4 border-primary-500 pl-4 py-2">
                          {editingClient && editingClient.cli === client.cli ? (
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
                                    value={editingClient.fatca_status}
                                    onChange={(e) => setEditingClient({...editingClient, fatca_status: e.target.value})}
                                  >
                                    <option value="À vérifier">À vérifier</option>
                                    <option value="Confirmé">Confirmé</option>
                                    <option value="Exclu">Exclu</option>
                                    <option value="En attente">En attente</option>
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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">Informations client</h3>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Code client:</span>
                                      <span className="text-sm font-medium">{client.cli}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Nom complet:</span>
                                      <span className="text-sm font-medium">{client.nom || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Date entrée relation:</span>
                                      <span className="text-sm font-medium">{formatDate(client.date_entree_relation)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Statut client:</span>
                                      <span className="text-sm font-medium">{client.status_client}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Pays de naissance:</span>
                                      <span className="text-sm font-medium">
                                        <UsIndicator value={client.pays_naissance} isUs={client.pays_naissance === 'US'} />
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Nationalité:</span>
                                      <span className="text-sm font-medium">
                                        <UsIndicator value={client.nationalite} isUs={client.nationalite === 'US'} />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">Coordonnées</h3>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Adresse:</span>
                                      <span className="text-sm font-medium">{client.adresse}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Pays d'adresse:</span>
                                      <span className="text-sm font-medium">
                                        <UsIndicator value={client.pays_adresse} isUs={client.pays_adresse === 'US'} />
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Téléphone:</span>
                                      <span className="text-sm font-medium">
                                        <UsIndicator value={client.telephone} isUs={!!client.telephone && client.telephone.startsWith('+1')} />
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Relation client:</span>
                                      <span className="text-sm font-medium">{client.relation_client || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Type relation:</span>
                                      <span className="text-sm font-medium">{client.type_relation || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-200 pt-3">
                                <h3 className="text-sm font-medium text-gray-900">Statut FATCA</h3>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Statut actuel:</span>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusColor(client.fatca_status)}`}>
                                      {getStatusIcon(client.fatca_status)}
                                      {client.fatca_status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Date de mise à jour:</span>
                                    <span className="text-sm font-medium">{formatDate(client.fatca_date) || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Mis à jour par:</span>
                                    <span className="text-sm font-medium">{client.fatca_uti || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Notes:</span>
                                    <span className="text-sm font-medium">{client.notes || '-'}</span>
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