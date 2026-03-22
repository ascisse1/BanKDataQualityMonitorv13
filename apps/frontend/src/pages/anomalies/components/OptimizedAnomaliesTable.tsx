import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import { useDebounce } from '../../../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';

interface OptimizedAnomaliesTableProps {
  isLoading?: boolean;
  searchQuery: string;
  selectedAgency: string | null;
}

const ROW_HEIGHT = 52;
const TABLE_HEIGHT = 600;
const ITEMS_PER_PAGE = 100;

const OptimizedAnomaliesTable: React.FC<OptimizedAnomaliesTableProps> = ({
  isLoading = false,
  searchQuery,
  selectedAgency
}) => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { addToast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedAgency]);

  useEffect(() => {
    fetchAnomalies();
  }, [selectedAgency, currentPage, debouncedSearch]);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {};
      if (selectedAgency) params.agencyCode = selectedAgency;
      if (debouncedSearch) params.search = debouncedSearch;

      const [individualRes, corporateRes] = await Promise.all([
        db.getIndividualAnomalies(currentPage, ITEMS_PER_PAGE, false, params),
        db.getCorporateAnomalies(currentPage, ITEMS_PER_PAGE, false, params)
      ]);

      const allAnomalies = [...individualRes.data, ...corporateRes.data];
      const totalCount = individualRes.total + corporateRes.total;

      setAnomalies(allAnomalies);
      setTotalRecords(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)));
    } catch (error) {
      addToast('Erreur lors du chargement des anomalies', 'error');
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedAgency, currentPage, debouncedSearch, addToast]);

  // Virtual row rendering for large lists
  const rowVirtualizer = useVirtualizer({
    count: anomalies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const columns = useMemo(() => [
    { key: 'cli', header: 'Code Client', width: '120px' },
    { key: 'nom', header: 'Nom Client', width: '180px' },
    { key: 'pre', header: 'Prénom', width: '140px' },
    { key: 'field', header: 'Champ', width: '180px' },
    { key: 'errorType', header: 'Type d\'erreur', width: '160px' },
    { key: 'age', header: 'Agence', width: '100px' },
    { key: 'severity', header: 'Sévérité', width: '100px' },
    { key: 'status', header: 'Statut', width: '100px' },
  ], []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Haute': return 'bg-error-100 text-error-800';
      case 'Moyenne': return 'bg-warning-100 text-warning-800';
      case 'Faible': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'bg-warning-100 text-warning-800';
      case 'En cours': return 'bg-primary-100 text-primary-800';
      case 'Corrigé':
      case 'Résolu': return 'bg-success-100 text-success-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    parentRef.current?.scrollTo(0, 0);
  }, [totalPages]);

  if (loading && anomalies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-3 text-gray-500">Chargement des anomalies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          <span className="font-medium text-gray-900">{totalRecords.toLocaleString('fr-FR')}</span> anomalies
          {selectedAgency && <span className="ml-1">pour l'agence {selectedAgency}</span>}
          {debouncedSearch && <span className="ml-1">— recherche: "{debouncedSearch}"</span>}
        </div>
        {loading && (
          <div className="flex items-center text-primary-500">
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Mise à jour...
          </div>
        )}
      </div>

      {/* Virtualized table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {columns.map((col) => (
              <div
                key={col.key}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-shrink-0"
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.header}
              </div>
            ))}
          </div>
        </div>

        {/* Virtualized body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: Math.min(TABLE_HEIGHT, anomalies.length * ROW_HEIGHT + 2) }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const anomaly = anomalies[virtualRow.index];
              return (
                <div
                  key={`${anomaly.cli}-${virtualRow.index}`}
                  className="flex border-b border-gray-100 hover:bg-gray-50 absolute top-0 left-0 w-full"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '120px' }}>
                    <span className="text-sm font-medium text-gray-900 truncate">{anomaly.cli}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '180px' }}>
                    <span className="text-sm text-gray-900 truncate">{anomaly.nom}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '140px' }}>
                    <span className="text-sm text-gray-900 truncate">{anomaly.pre || '-'}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '180px' }}>
                    <span className="text-sm text-gray-900 truncate">
                      {anomaly.field || anomaly.fieldCode}
                    </span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '160px' }}>
                    <AlertTriangle className="h-3.5 w-3.5 text-warning-500 mr-1 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{anomaly.errorType}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '100px' }}>
                    <span className="text-sm font-medium truncate">{anomaly.age || 'N/A'}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '100px' }}>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <div className="px-3 py-2 flex items-center flex-shrink-0" style={{ width: '100px' }}>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(anomaly.status)}`}>
                      {anomaly.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={goToPage}
        isLoading={loading}
        summaryText={`Page ${currentPage} sur ${totalPages.toLocaleString('fr-FR')} (${totalRecords.toLocaleString('fr-FR')} enregistrements)`}
      />
    </div>
  );
};

export default OptimizedAnomaliesTable;
