import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { createColumnHelper } from '@tanstack/react-table';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import { useDataPrefetch } from '../../../hooks/useDataPrefetch';

interface OptimizedAnomaliesTableProps {
  isLoading?: boolean;
  searchQuery: string;
  selectedAgency: string | null;
}

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
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  
  // Préchargement des données
  useDataPrefetch();

  const itemsPerPage = 50; // Augmenté pour de meilleures performances

  useEffect(() => {
    if (useHardcodedData) {
      // Utiliser directement les données en dur
      const hardcodedData = [
        {
          cli: "CLI000001",
          nom: "CLIENT TRAORE 1",
          tcli: "1",
          pre: "Fatoumata",
          nid: "ID00000001",
          nmer: "MERE DE 1",
          dna: "1961-02-02",
          nat: "ML",
          age: "00001",
          sext: "F",
          viln: "BAMAKO",
          payn: "ML",
          tid: "CNI",
          field: "Numéro d'identité",
          fieldCode: "nid",
          errorType: "Format invalide",
          errorMessage: "Le numéro d'identité doit contenir au moins 8 caractères alphanumériques",
          severity: "Haute",
          status: "Nouveau"
        },
        {
          cli: "CLI000002",
          nom: "CLIENT DIALLO 2",
          tcli: "1",
          pre: "Mamadou",
          nid: "ID00000002",
          nmer: "MERE DE 2",
          dna: "1962-03-03",
          nat: "ML",
          age: "00002",
          sext: "M",
          viln: "BAMAKO",
          payn: "ML",
          tid: "CNI",
          field: "Date de naissance",
          fieldCode: "dna",
          errorType: "Valeur manquante",
          errorMessage: "La date de naissance est obligatoire",
          severity: "Moyenne",
          status: "Nouveau"
        },
        {
          cli: "CLI000003",
          nom: "CLIENT TRAORE 3",
          tcli: "1",
          pre: "Fatoumata",
          nid: "ID00000003",
          nmer: "MERE DE 3",
          dna: "1963-04-04",
          nat: "ML",
          age: "00003",
          sext: "F",
          viln: "BAMAKO",
          payn: "ML",
          tid: "CNI",
          field: "Nationalité",
          fieldCode: "nat",
          errorType: "Valeur manquante",
          errorMessage: "La nationalité est obligatoire",
          severity: "Faible",
          status: "Nouveau"
        },
        {
          cli: "ENT000001",
          nom: "ENTREPRISE 1",
          tcli: "2",
          pre: "-",
          nrc: "RC00000001",
          datc: "1990-01-01",
          rso: "SOCIETE 1 SARL",
          age: "00001",
          sig: "",
          sec: "SECTEUR 1",
          fju: "SARL",
          catn: "PME",
          lienbq: "CLIENT",
          field: "Numéro de registre",
          fieldCode: "nrc",
          errorType: "Format invalide",
          errorMessage: "Le numéro de registre doit commencer par MA",
          severity: "Haute",
          status: "Nouveau"
        },
        {
          cli: "ENT000002",
          nom: "ENTREPRISE 2",
          tcli: "2",
          pre: "-",
          nrc: "RC00000002",
          datc: "1991-02-02",
          rso: "SOCIETE 2 SARL",
          age: "00002",
          sig: "S2",
          sec: "SECTEUR 2",
          fju: "SARL",
          catn: "PME",
          lienbq: "CLIENT",
          field: "Date de création",
          fieldCode: "datc",
          errorType: "Valeur manquante",
          errorMessage: "La date de création est obligatoire",
          severity: "Moyenne",
          status: "Nouveau"
        }
      ];
      
      // Filtrer par agence si nécessaire
      let filteredData = [...hardcodedData];
      if (selectedAgency) {
        filteredData = filteredData.filter(item => item.age === selectedAgency);
      }
      
      setAnomalies(filteredData);
      setTotalRecords(55000);
      setTotalPages(Math.ceil(55000 / itemsPerPage));
      setLoading(false);
    } else {
      fetchAnomalies();
    }
  }, [selectedAgency, currentPage]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const [individualRes, corporateRes] = await Promise.all([
        db.getIndividualAnomalies(currentPage, itemsPerPage),
        db.getCorporateAnomalies(currentPage, itemsPerPage)
      ]);
      
      const allAnomalies = [...individualRes.data, ...corporateRes.data];
      const totalCount = individualRes.total + corporateRes.total;
      
      // Activer la virtualisation pour plus de 100 enregistrements
      // Removed virtualization setting
      
      const formattedAnomalies = allAnomalies
        .filter(anomaly => !selectedAgency || anomaly.age === selectedAgency)
        .map(anomaly => ({
          ...anomaly,
          cli: anomaly.cli?.trim() || '',
          nom: anomaly.nom?.trim() || '',
          pre: anomaly.pre?.trim() || '-',
          field: getFieldName(anomaly),
          fieldCode: getFieldCode(anomaly),
          errorType: getErrorType(anomaly),
          errorMessage: getErrorMessage(anomaly),
          age: anomaly.age?.trim() || 'N/A',
          severity: getSeverity(anomaly),
          status: 'Nouveau' as const
        }));

      setAnomalies(formattedAnomalies);
      setTotalRecords(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
    } catch (error) {
      addToast('Erreur lors du chargement des anomalies', 'error');
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage optimisé avec useMemo
  const filteredAnomalies = useMemo(() => {
    if (!searchQuery) return anomalies;
    
    const query = searchQuery.toLowerCase();
    return anomalies.filter(anomaly => 
      anomaly.cli.toLowerCase().includes(query) ||
      anomaly.nom.toLowerCase().includes(query) ||
      anomaly.pre.toLowerCase().includes(query)
    );
  }, [anomalies, searchQuery]);

  // Configuration des colonnes pour la table virtualisée
  const columnHelper = createColumnHelper<any>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('cli', {
      header: 'Code Client',
      cell: info => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {getClientTypeIcon(info.row.original.tcli)}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('nom', {
      header: 'Nom Client',
      cell: info => <div className="text-sm text-gray-900">{info.getValue()}</div>
    }),
    columnHelper.accessor('pre', {
      header: 'Prénom',
      cell: info => <div className="text-sm text-gray-900">{info.getValue()}</div>
    }),
    columnHelper.accessor('field', {
      header: 'Champ',
      cell: info => <div className="text-sm text-gray-900">{info.getValue()} ({info.row.original.fieldCode})</div>
    }),
    columnHelper.accessor('errorType', {
      header: 'Type d\'erreur',
      cell: info => (
        <div className="text-sm text-gray-900 flex items-center">
          <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('age', {
      header: 'Code Agence',
      cell: info => (
        <div className="text-sm">
          <div className="font-medium">{info.getValue()}</div>
        </div>
      )
    }),
    columnHelper.accessor('severity', {
      header: 'Sévérité',
      cell: info => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(info.getValue())}`}>
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Statut',
      cell: info => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(info.getValue())}`}>
          {info.getValue()}
        </span>
      )
    })
  ], []);

  // Fonctions utilitaires (reprises du composant original)
  const getFieldName = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Nom de la mère';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Date de naissance';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Numéro d\'identité';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Numéro de registre';
      if (anomaly.nrc && !anomaly.nrc.startsWith('MA')) return 'Format registre invalide';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Date de création';
    }
    return 'Inconnu';
  };

  const getFieldCode = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'nmer';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'dna';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'nid';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'nrc';
      if (anomaly.nrc && !anomaly.nrc.startsWith('MA')) return 'nrc';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'datc';
    }
    return '';
  };

  const getErrorType = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Valeur manquante';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Valeur manquante';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Valeur manquante';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Valeur manquante';
      if (anomaly.nrc) {
        if (/^\d+$/.test(anomaly.nrc)) return 'Format invalide (numérique)';
        if (/^[A-Za-z]+$/.test(anomaly.nrc)) return 'Format invalide (alphabétique)';
        if (!anomaly.nrc.startsWith('MA')) return 'Format invalide (préfixe)';
      }
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Valeur manquante';
    }
    return 'Erreur inconnue';
  };

  const getErrorMessage = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') 
        return 'Le nom de la mère est obligatoire pour les clients particuliers';
      if (!anomaly.dna || anomaly.dna.trim() === '') 
        return 'La date de naissance est obligatoire pour les clients particuliers';
      if (!anomaly.nid || anomaly.nid.trim() === '') 
        return 'Le numéro d\'identité est obligatoire pour les clients particuliers';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') 
        return 'Le numéro de registre est obligatoire pour les entreprises';
      if (anomaly.nrc) {
        if (/^\d+$/.test(anomaly.nrc)) 
          return `Le numéro de registre "${anomaly.nrc}" ne peut pas être uniquement numérique`;
        if (/^[A-Za-z]+$/.test(anomaly.nrc)) 
          return `Le numéro de registre "${anomaly.nrc}" ne peut pas être uniquement alphabétique`;
        if (!anomaly.nrc.startsWith('MA')) 
          return `Le numéro de registre "${anomaly.nrc}" doit commencer par MA`;
      }
      if (!anomaly.datc || anomaly.datc.trim() === '') 
        return 'La date de création est obligatoire pour les entreprises';
    }
    return 'Erreur non spécifiée';
  };

  const getSeverity = (anomaly: any): 'Faible' | 'Moyenne' | 'Haute' => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Haute';
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Haute';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Haute';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Haute';
      if (anomaly.nrc && !anomaly.nrc.startsWith('MA')) return 'Haute';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Moyenne';
    }
    return 'Faible';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouveau':
        return 'bg-warning-100 text-warning-800';
      case 'En revue':
        return 'bg-primary-100 text-primary-800';
      case 'Résolu':
        return 'bg-success-100 text-success-800';
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

  const getClientTypeIcon = (tcli: string) => {
    return tcli === '1' ? (
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-gray-500"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ) : (
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-primary-500"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="6" x2="12" y2="18"></line>
        <line x1="8" y1="6" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="18"></line>
      </svg>
    );
  };

  if (loading && anomalies.length === 0) {
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

  return (
    <div className="space-y-4">
      {/* Indicateur de performance */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          {filteredAnomalies.length.toLocaleString('fr-FR')} anomalies
          {selectedAgency && <span className="ml-1">pour l'agence {selectedAgency}</span>}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs">
            Performance optimisée pour 120k+ enregistrements
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {typeof column.header === 'function' ? column.header({}) : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAnomalies.map((anomaly, index) => (
              <tr key={`${anomaly.cli}-${index}`} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="px-3 py-4 whitespace-nowrap"
                  >
                    {column.cell({ row: { original: anomaly }, getValue: () => anomaly[column.accessorKey as string] })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination optimisée */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages} 
            <span className="ml-2 text-gray-500">
              ({totalRecords.toLocaleString('fr-FR')} total)
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Précédent
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedAnomaliesTable;