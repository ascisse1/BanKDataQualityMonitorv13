import React from 'react';
import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw, User, Building, Edit, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import AnomalyCorrection from './AnomalyCorrection';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import { useAuth } from '../../../context/AuthContext';

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
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [paginationKey, setPaginationKey] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.ceil(totalAnomalies / 10));
  const [totalRecords, setTotalRecords] = useState(totalAnomalies);
  const [editingAnomaly, setEditingAnomaly] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const isAgencyUser = user?.role === 'agency';
  const userAgencyCode = user?.agencyCode;

  // Données d'anomalies fictives pour la présentation
  const hardcodedAnomalies = [
    {
      cli: "CLI000001",
      nom: "OUEDRAOGO",
      tcli: "1",
      pre: "Moussa",
      nid: "",
      nmer: "DIALLO Aminata",
      dna: "1980-05-15",
      nat: "BF",
      age: "01001",
      sext: "M",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Numéro d'identité",
      fieldCode: "nid",
      errorType: "Valeur manquante",
      errorMessage: "Le numéro d'identité est obligatoire",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "CLI000002",
      nom: "KABORE",
      tcli: "1",
      pre: "Fatimata",
      nid: "BF12345",
      nmer: "",
      dna: "1975-10-20",
      nat: "BF",
      age: "01001",
      sext: "F",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Nom de la mère",
      fieldCode: "nmer",
      errorType: "Valeur manquante",
      errorMessage: "Le nom de la mère est obligatoire",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "CLI000003",
      nom: "SAWADOGO",
      tcli: "1",
      pre: "Ibrahim",
      nid: "BF67890",
      nmer: "DIALLO Kadiatou",
      dna: "",
      nat: "BF",
      age: "01002",
      sext: "M",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Date de naissance",
      fieldCode: "dna",
      errorType: "Valeur manquante",
      errorMessage: "La date de naissance est obligatoire",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "CLI000004",
      nom: "DIALLO",
      tcli: "1",
      pre: "Aminata",
      nid: "BF54321",
      nmer: "TRAORE Mariam",
      dna: "1990-03-25",
      nat: "",
      age: "01002",
      sext: "F",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Nationalité",
      fieldCode: "nat",
      errorType: "Valeur manquante",
      errorMessage: "La nationalité est obligatoire",
      severity: "Moyenne",
      status: "Nouveau"
    },
    {
      cli: "CLI000005",
      nom: "TRAORE",
      tcli: "1",
      pre: "Oumar",
      nid: "BF09876",
      nmer: "COULIBALY Fatoumata",
      dna: "1985-12-10",
      nat: "BF",
      age: "01003",
      sext: "",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Sexe",
      fieldCode: "sext",
      errorType: "Valeur manquante",
      errorMessage: "Le sexe doit être renseigné (M/F)",
      severity: "Moyenne",
      status: "Nouveau"
    },
    {
      cli: "CLI000006",
      nom: "SISSOKO",
      tcli: "1",
      pre: "Mariam",
      nid: "BF13579",
      nmer: "KEITA Aminata",
      dna: "1982-07-30",
      nat: "BF",
      age: "01003",
      sext: "F",
      viln: "",
      payn: "BF",
      tid: "CIN",
      field: "Ville de naissance",
      fieldCode: "viln",
      errorType: "Valeur manquante",
      errorMessage: "La ville de naissance est obligatoire",
      severity: "Faible",
      status: "Nouveau"
    },
    {
      cli: "CLI000007",
      nom: "KONE",
      tcli: "1",
      pre: "Seydou",
      nid: "BF24680",
      nmer: "TOURE Kadiatou",
      dna: "1978-09-18",
      nat: "BF",
      age: "01004",
      sext: "M",
      viln: "Bobo-Dioulasso",
      payn: "",
      tid: "CIN",
      field: "Pays de naissance",
      fieldCode: "payn",
      errorType: "Valeur manquante",
      errorMessage: "Le pays de naissance est obligatoire",
      severity: "Faible",
      status: "Nouveau"
    },
    {
      cli: "CLI000008",
      nom: "CAMARA",
      tcli: "1",
      pre: "Kadiatou",
      nid: "BF97531",
      nmer: "SISSOKO Mariam",
      dna: "1995-04-05",
      nat: "BF",
      age: "01004",
      sext: "F",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "",
      field: "Type de pièce d'identité",
      fieldCode: "tid",
      errorType: "Valeur manquante",
      errorMessage: "Le type de pièce d'identité est obligatoire",
      severity: "Moyenne",
      status: "Nouveau"
    },
    {
      cli: "CLI000009",
      nom: "COMPAORE",
      tcli: "1",
      pre: "Jean",
      nid: "BF12345",
      nmer: "COMPAORE Marie",
      dna: "1970-01-01",
      nat: "BF",
      age: "01005",
      sext: "M",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Nationalité",
      fieldCode: "nat",
      errorType: "Indice FATCA",
      errorMessage: "Client avec nationalité américaine - Vérification FATCA requise",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "CLI000010",
      nom: "ZONGO",
      tcli: "1",
      pre: "Sarah",
      nid: "BF67890",
      nmer: "ZONGO Emma",
      dna: "1985-06-15",
      nat: "BF",
      age: "01005",
      sext: "F",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "CIN",
      field: "Pays de naissance",
      fieldCode: "payn",
      errorType: "Indice FATCA",
      errorMessage: "Client né aux États-Unis - Vérification FATCA requise",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "ENT000001",
      nom: "SOCIETE GENERALE DE COMMERCE BURKINA",
      tcli: "2",
      pre: "-",
      nid: "-",
      nmer: "-",
      dna: "-",
      nat: "BF",
      age: "01001",
      sext: "-",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "-",
      nrc: "",
      datc: "2010-05-15",
      rso: "SOCIETE GENERALE DE COMMERCE SARL",
      field: "Numéro de registre",
      fieldCode: "nrc",
      errorType: "Valeur manquante",
      errorMessage: "Le numéro de registre est obligatoire pour les entreprises",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "ENT000002",
      nom: "ENTREPRISE DE CONSTRUCTION BURKINA",
      tcli: "2",
      pre: "-",
      nid: "-",
      nmer: "-",
      dna: "-",
      nat: "BF",
      age: "01002",
      sext: "-",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "-",
      nrc: "BF12345",
      datc: "",
      rso: "ENTREPRISE DE CONSTRUCTION BURKINA SA",
      field: "Date de création",
      fieldCode: "datc",
      errorType: "Valeur manquante",
      errorMessage: "La date de création est obligatoire pour les entreprises",
      severity: "Moyenne",
      status: "Nouveau"
    },
    {
      cli: "ENT000003",
      nom: "COMPAGNIE MINIERE DU FASO",
      tcli: "2",
      pre: "-",
      nid: "-",
      nmer: "-",
      dna: "-",
      nat: "BF",
      age: "01003",
      sext: "-",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "-",
      nrc: "BF67890",
      datc: "2015-03-20",
      rso: "",
      field: "Raison sociale",
      fieldCode: "rso",
      errorType: "Valeur manquante",
      errorMessage: "La raison sociale est obligatoire pour les entreprises",
      severity: "Haute",
      status: "Nouveau"
    },
    {
      cli: "ENT000004",
      nom: "BURKINA IMPORT-EXPORT",
      tcli: "2",
      pre: "-",
      nid: "-",
      nmer: "-",
      dna: "-",
      nat: "BF",
      age: "01004",
      sext: "-",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "-",
      nrc: "BF54321",
      datc: "2005-11-30",
      rso: "SOCIETE BURKINA IMPORT-EXPORT",
      field: "Secteur d'activité",
      fieldCode: "sec",
      errorType: "Valeur manquante",
      errorMessage: "Le secteur d'activité est obligatoire",
      severity: "Moyenne",
      status: "Nouveau"
    },
    {
      cli: "ENT000005",
      nom: "TRANSPORT FASO INTERNATIONAL",
      tcli: "2",
      pre: "-",
      nid: "-",
      nmer: "-",
      dna: "-",
      nat: "BF",
      age: "01005",
      sext: "-",
      viln: "Ouagadougou",
      payn: "BF",
      tid: "-",
      nrc: "BF09876",
      datc: "2012-07-15",
      rso: "TRANSPORT FASO INTERNATIONAL SARL",
      field: "Forme juridique",
      fieldCode: "fju",
      errorType: "Valeur manquante",
      errorMessage: "La forme juridique est obligatoire",
      severity: "Moyenne",
      status: "Nouveau"
    }
  ];

  const fetchAnomalies = async () => {
    try {
      setPageLoading(true);
      setError(null);

      let query = db.collection('anomalies');

      // Filtrage par agence
      if (selectedAgency) {
        query = query.where('agencyCode', '==', selectedAgency);
      } else if (isAgencyUser && userAgencyCode) {
        query = query.where('agencyCode', '==', userAgencyCode);
      }

      // Filtrage par statut
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.where('status', '==', selectedStatus);
      }

      // Filtrage par type
      if (selectedClientType && selectedClientType !== 'all') {
        query = query.where('type', '==', selectedClientType);
      }

      const snapshot = await query.get();
      let anomaliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrage par terme de recherche (côté client)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        anomaliesData = anomaliesData.filter(anomaly => {
          return (
            (anomaly.cli && anomaly.cli.toLowerCase().includes(searchLower)) ||
            (anomaly.nom && anomaly.nom.toLowerCase().includes(searchLower)) ||
            (anomaly.pre && anomaly.pre.toLowerCase().includes(searchLower)) ||
            (anomaly.email && anomaly.email.toLowerCase().includes(searchLower)) ||
            (anomaly.telephone && anomaly.telephone.toLowerCase().includes(searchLower))
          );
        });
      }

      // Pagination
      const totalRecords = anomaliesData.length;
      const totalPages = Math.ceil(totalRecords / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = anomaliesData.slice(startIndex, endIndex);

      setAnomalies(paginatedData);
      setTotalRecords(totalRecords);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des anomalies:', error);
      setError('Erreur lors du chargement des anomalies');
      addToast('Erreur lors du chargement des anomalies', 'error');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAgency, searchTerm, selectedStatus, selectedClientType]);

  useEffect(() => {
    // Reset expanded row when page changes
    setExpandedRow(null);
    setEditingAnomaly(null);
    
    // Use hardcoded data instead of fetching
    let filteredAnomalies = [...hardcodedAnomalies];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredAnomalies = filteredAnomalies.filter(anomaly => {
        return (
          (anomaly.cli && anomaly.cli.toLowerCase().includes(searchLower)) ||
          (anomaly.nom && anomaly.nom.toLowerCase().includes(searchLower)) ||
          (anomaly.pre && anomaly.pre.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply agency filter
    if (selectedAgency) {
      // Convert both to strings and trim to ensure proper comparison
      const agencyCode = String(selectedAgency).trim();
      filteredAnomalies = filteredAnomalies.filter(anomaly => 
        String(anomaly.age).trim() === agencyCode
      );
    }
    
    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.status === selectedStatus);
    }
    
    // Apply client type filter
    if (selectedClientType && selectedClientType !== 'all') {
      filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.tcli === selectedClientType);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    filteredAnomalies = filteredAnomalies.slice(startIndex, endIndex);
    
    setAnomalies(filteredAnomalies);
    setLoading(false);
  }, [selectedAgency, searchTerm, selectedStatus, selectedClientType, currentPage, userAgencyCode, paginationKey]);

  const toggleExpandRow = (cli: string) => {
    setExpandedRow(expandedRow === cli ? null : cli);
  };

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
    if (anomaly.field) {
      return anomaly.field;
    }
    
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Nom de la mère';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Date de naissance';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Numéro d\'identité';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'Nationalité';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Numéro de registre';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Date de création';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'Raison sociale';
    }
    return 'Inconnu';
  };

  const getFieldCode = (anomaly: any) => {
    if (anomaly.fieldCode) {
      return anomaly.fieldCode;
    }
    
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'nmer';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'dna';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'nid';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'nat';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'nrc';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'datc';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'rso';
    }
    return '';
  };

  const getFieldValue = (anomaly: any) => {
    const fieldCode = getFieldCode(anomaly);
    if (!fieldCode) return '';
    
    return anomaly[fieldCode] || '';
  };

  const getErrorMessage = (anomaly: any) => {
    if (anomaly.errorMessage) {
      return anomaly.errorMessage;
    }
    
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') 
        return 'Le nom de la mère est obligatoire pour les clients particuliers';
      if (!anomaly.dna || anomaly.dna.trim() === '') 
        return 'La date de naissance est obligatoire pour les clients particuliers';
      if (!anomaly.nid || anomaly.nid.trim() === '') 
        return 'Le numéro d\'identité est obligatoire pour les clients particuliers';
      if (!anomaly.nat || anomaly.nat.trim() === '') 
        return 'La nationalité est obligatoire pour les clients particuliers';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') 
        return 'Le numéro de registre est obligatoire pour les entreprises';
      if (!anomaly.datc || anomaly.datc.trim() === '') 
        return 'La date de création est obligatoire pour les entreprises';
      if (!anomaly.rso || anomaly.rso.trim() === '') 
        return 'La raison sociale est obligatoire pour les entreprises';
    }
    return 'Erreur non spécifiée';
  };

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Calculate total pages based on hardcoded data
    const calculatedTotalPages = Math.ceil(hardcodedAnomalies.length / itemsPerPage);
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(calculatedTotalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            currentPage === i
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => setCurrentPage(Math.min(calculatedTotalPages, currentPage + 1))}
          disabled={currentPage === calculatedTotalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
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
        <Button onClick={fetchAnomalies} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      {/* Modal pour la correction d'anomalie */}
      {editingAnomaly && !expandedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Correction d'anomalie</h2>
            <AnomalyCorrection 
              anomaly={editingAnomaly}
              onCorrectionComplete={() => {
                setEditingAnomaly(null);
                fetchAnomalies();
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
        </div>
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
                Type d'anomalie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de détection
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {anomalies.length === 0 ? (
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
              anomalies.map((anomaly) => (
                <React.Fragment key={anomaly.cli}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${anomaly.tcli === '1' ? 'bg-primary-100' : 'bg-secondary-100'} flex items-center justify-center`}>
                            {anomaly.tcli === '1' ? (
                              <User className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Building className="h-5 w-5 text-secondary-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {anomaly.nom} {anomaly.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            CLI: {anomaly.cli}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />
                        <span className="ml-2 text-sm text-gray-900">{anomaly.errorType || 'Valeur manquante'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(anomaly.status)}`}>
                        {anomaly.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm" 
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => toggleExpandRow(anomaly.cli)}
                        >
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="h-4 w-4" />}
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
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => toggleExpandRow(anomaly.cli)}
                        >
                          {expandedRow === anomaly.cli ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === anomaly.cli && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="border-l-4 border-primary-500 pl-4 py-2">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editingAnomaly && editingAnomaly.cli === anomaly.cli ? (
                                <AnomalyCorrection 
                                  anomaly={editingAnomaly}
                                  onCorrectionComplete={() => {
                                    setEditingAnomaly(null);
                                    fetchAnomalies();
                                  }}
                                />
                              ) : (
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Informations client</h3>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Type d'anomalie:</span>
                                    <span className="text-sm font-medium">{anomaly.errorType || 'Valeur manquante'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Code client:</span>
                                    <span className="text-sm font-medium">{anomaly.cli}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Nom:</span>
                                    <span className="text-sm font-medium">{anomaly.nom}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Prénom:</span>
                                    <span className="text-sm font-medium">{anomaly.pre || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Type de client:</span>
                                    <span className="text-sm font-medium flex items-center">
                                      {anomaly.tcli === '1' ? (
                                        <>
                                          <User className="h-4 w-4 text-primary-600 mr-1" />
                                          Particulier
                                        </>
                                      ) : anomaly.tcli === '2' ? (
                                        <>
                                          <Building className="h-4 w-4 text-secondary-600 mr-1" />
                                          Entreprise
                                        </>
                                      ) : (
                                        <>
                                          <Users className="h-4 w-4 text-gray-600 mr-1" />
                                          Institutionnel
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Champ en anomalie:</span>
                                    <span className="text-sm font-medium text-red-600">{getFieldName(anomaly)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Agence:</span>
                                    <span className="text-sm font-medium">{anomaly.age || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Sévérité:</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getSeverityColor(anomaly.severity || 'Haute')}`}>
                                      {anomaly.severity || 'Haute'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              )}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-3">
                              <h3 className="text-sm font-medium text-gray-900">Détails de l'anomalie</h3>
                              <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Champ concerné:</span>
                                    <span className="text-sm font-medium">{getFieldName(anomaly)} ({getFieldCode(anomaly)})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Valeur actuelle:</span>
                                    <span className="text-sm font-medium text-red-600">{getFieldValue(anomaly) || '<vide>'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Message d'erreur:</span>
                                    <span className="text-sm font-medium text-red-600">{anomaly.errorMessage || getErrorMessage(anomaly)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Taux de fiabilisation:</span>
                                    <span className="text-sm font-medium text-success-600">
                                      {Math.floor(Math.random() * 30 + 60)}%
                                    </span>
                                  </div>
                                  <div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div 
                                        className="bg-success-500 h-2 rounded-full" 
                                        style={{ width: `${Math.floor(Math.random() * 30 + 60)}%` }}
                                      />
                                    </div>
                                </div>
                              </div>
                              
                              {(anomaly.status === 'Résolu' || anomaly.status === 'Rejeté') && (
                                <div className="text-sm text-gray-500">
                                  Cette anomalie a été {anomaly.status === 'Résolu' ? 'résolue' : 'rejetée'}.
                                </div>
                              )}
                            </div>
                          </div>
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
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage de <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, hardcodedAnomalies.length)}
            </span> sur <span className="font-medium">{hardcodedAnomalies.length.toLocaleString('fr-FR')}</span> clients avec anomalies
            {selectedAgency && <span className="ml-1 text-primary-600 font-medium">pour l'agence {selectedAgency}</span>}
            {isAgencyUser && userAgencyCode && <span className="ml-1 text-primary-600 font-medium">pour votre agence {userAgencyCode}</span>}
          </div>
          
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default AnomaliesTable;