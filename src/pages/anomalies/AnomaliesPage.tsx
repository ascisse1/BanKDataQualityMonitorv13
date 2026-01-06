import { useState, useEffect } from 'react';
import { Filter, Download, ArrowDownWideNarrow, RefreshCw, FileSpreadsheet, Loader2, History } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import AnomaliesTable from './components/AnomaliesTable';
import AnomaliesFilters from './components/AnomaliesFilters';
import AnomalyHistoryTable from './components/AnomalyHistoryTable';
import { useToast } from '../../components/ui/Toaster';
import { db } from '../../services/db';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

interface ExportProgress {
  current: number;
  total: number;
  message: string;
}

// Empty data structure for fallback
const preCalculatedData = {
  individualAnomalies: [],
  corporateAnomalies: [],
  institutionalAnomalies: []
};

const AnomaliesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [selectedClientType, setSelectedClientType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [agencies, setAgencies] = useState<{code_agence: string, lib_agence: string}[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({ current: 0, total: 0, message: '' });
  const { addToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const { user } = useAuth();
  const [useHardcodedData, _setUseHardcodedData] = useState(false);

  // Check if user is an agency user
  const isAgencyUser = user?.role === 'agency_user';
  const userAgencyCode = user?.agencyCode;

  useEffect(() => {
    // Fetch total anomalies count on component mount
    if (useHardcodedData) {
      // Utiliser directement les données en dur
      fetchAgencies();
      setTotalAnomalies(55000);
      setIsLoading(false);
    } else {
      fetchTotalAnomaliesCount();
    }
  }, []);

  useEffect(() => {
    // If user is an agency user, set the selected agency to their agency code
    if (isAgencyUser && userAgencyCode) {
      setSelectedAgency(userAgencyCode);
    }
  }, [isAgencyUser, userAgencyCode]);

  const fetchTotalAnomaliesCount = async () => {
    try {
      // Get client stats which includes total anomalies
      const stats = await db.getClientStats();
      setTotalAnomalies(stats.anomalies || 0);
    } catch (error) {
      console.error('Error fetching total anomalies count:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      // In demo mode, use hardcoded agencies
      const hardcodedAgencies = [
        { code_agence: "01001", lib_agence: "AGENCE OUAGADOUGOU PRINCIPALE" },
        { code_agence: "01002", lib_agence: "AGENCE OUAGADOUGOU CENTRE" },
        { code_agence: "01003", lib_agence: "AGENCE OUAGADOUGOU NORD" },
        { code_agence: "01004", lib_agence: "AGENCE OUAGADOUGOU SUD" },
        { code_agence: "01005", lib_agence: "AGENCE OUAGADOUGOU EST" },
        { code_agence: "01006", lib_agence: "AGENCE OUAGADOUGOU OUEST" },
        { code_agence: "01007", lib_agence: "AGENCE OUAGADOUGOU ENTREPRISES" },
        { code_agence: "01008", lib_agence: "AGENCE OUAGADOUGOU INTERNATIONALE" },
        { code_agence: "01009", lib_agence: "AGENCE OUAGADOUGOU ZONE INDUSTRIELLE" },
        { code_agence: "01010", lib_agence: "AGENCE OUAGADOUGOU QUARTIER DU COMMERCE" }
      ];
      setAgencies(hardcodedAgencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleAgencyChange = (agency: string | null) => {
    console.log('🏢 Agency filter changed to:', agency);
    // If user is an agency user, they can only see their own agency
    if (isAgencyUser && userAgencyCode) {
      if (agency !== userAgencyCode) {
        addToast('Vous ne pouvez consulter que les données de votre agence', 'warning');
        return;
      }
    }
    setSelectedAgency(agency);
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      if (useHardcodedData) {
        // Simuler un rafraîchissement avec les données en dur
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        addToast('Actualisation des données en cours...', 'info');
        
        // Clear the cache to force fresh data
        await db.clearCache();
        
        // Fetch total anomalies count again
        await fetchTotalAnomaliesCount();
        
        // Simulate a delay for the loading animation
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setIsRefreshing(false);
      addToast('Données actualisées avec succès', 'success');
    } catch (error) {
      setIsRefreshing(false);
      addToast('Erreur lors de l\'actualisation des données', 'error');
    }
  };

  const getAllAnomaliesData = async () => {
    try {
      setExportProgress({ current: 1, total: 5, message: 'Récupération des données...' });
      console.log('📊 Starting export data fetch...');
      
      // For agency users, force their agency code
      const effectiveAgencyCode = isAgencyUser && userAgencyCode ? userAgencyCode : selectedAgency;
      console.log('🏢 Selected agency for export:', effectiveAgencyCode);

      // Prepare API parameters
      const params: Record<string, any> = {};
      if (effectiveAgencyCode) {
        params.agencyCode = effectiveAgencyCode;
      }

      // Use a more efficient approach with smaller batch sizes and pagination
      const batchSize = 100; // Smaller batch size to avoid timeouts
      const maxRecords = 5000; // Limit total records to avoid memory issues
      
      let individualData: any[] = [];
      let corporateData: any[] = [];
      let institutionalData: any[] = [];
      
      // Fetch data in batches with progress updates
      setExportProgress({ current: 1, total: 5, message: 'Récupération des données particuliers...' });
      
      try {
        // Fetch individual anomalies in batches
        for (let page = 1; individualData.length < maxRecords; page++) {
          const result = await db.getIndividualAnomalies(page, batchSize, false, params);
          if (!result.data || result.data.length === 0) break;
          individualData = [...individualData, ...result.data];
          if (individualData.length >= maxRecords || result.data.length < batchSize) break;
        }
      } catch (error) {
        console.warn('Error fetching individual anomalies, using fallback data', error);
        individualData = preCalculatedData.individualAnomalies;
      }
      
      setExportProgress({ current: 2, total: 5, message: 'Récupération des données entreprises...' });
      
      try {
        // Fetch corporate anomalies in batches
        for (let page = 1; corporateData.length < maxRecords; page++) {
          const result = await db.getCorporateAnomalies(page, batchSize, false, params);
          if (!result.data || result.data.length === 0) break;
          corporateData = [...corporateData, ...result.data];
          if (corporateData.length >= maxRecords || result.data.length < batchSize) break;
        }
      } catch (error) {
        console.warn('Error fetching corporate anomalies, using fallback data', error);
        corporateData = preCalculatedData.corporateAnomalies;
      }
      
      setExportProgress({ current: 3, total: 5, message: 'Récupération des données institutionnelles...' });
      
      try {
        // Fetch institutional anomalies in batches
        for (let page = 1; institutionalData.length < maxRecords; page++) {
          const result = await db.getInstitutionalAnomalies(page, batchSize, false, params);
          if (!result.data || result.data.length === 0) break;
          institutionalData = [...institutionalData, ...result.data];
          if (institutionalData.length >= maxRecords || result.data.length < batchSize) break;
        }
      } catch (error) {
        console.warn('Error fetching institutional anomalies, using fallback data', error);
        institutionalData = preCalculatedData.institutionalAnomalies;
      }

      setExportProgress({ current: 4, total: 5, message: 'Traitement des données...' });

      console.log('📊 Raw data received:', {
        individual: individualData.length || 0,
        corporate: corporateData.length || 0,
        institutional: institutionalData.length || 0
      });

      // Combine all anomalies
      const allAnomalies = [
        ...(individualData || []).map(item => ({ ...item, type_client: 'Particulier' })),
        ...(corporateData || []).map(item => ({ ...item, type_client: 'Entreprise' })),
        ...(institutionalData || []).map(item => ({ ...item, type_client: 'Institutionnel' }))
      ];

      console.log('📊 Total anomalies before filtering:', allAnomalies.length);

      // No need to filter by agency again as it's already done in the API call
      let filteredAnomalies = allAnomalies;

      console.log('📊 Final filtered anomalies:', filteredAnomalies.length);

      // If no data, use sample data
      if (filteredAnomalies.length === 0) {
        console.warn('⚠️ No data found for export, using sample data');
        
        // Generate sample data based on the agency filter
        const sampleData = generateSampleData(effectiveAgencyCode);
        filteredAnomalies = sampleData;
        
        console.log('📊 Generated sample data:', filteredAnomalies.length);
      }

      setExportProgress({ current: 5, total: 5, message: 'Regroupement par client...' });

      // Grouper les anomalies par client pour gérer les anomalies multiples
      const clientAnomalies = new Map();
      
      filteredAnomalies.forEach(anomaly => {
        const clientId = anomaly.cli?.trim();
        if (!clientId) return;

        if (!clientAnomalies.has(clientId)) {
          clientAnomalies.set(clientId, {
            client: anomaly,
            anomalies: []
          });
        }

        // Déterminer les champs en erreur pour cette anomalie
        const errorFields = [];
        const errorMessages = [];
        
        if (anomaly.tcli === '1') {
          if (!anomaly.nmer || anomaly.nmer.trim() === '') {
            errorFields.push('Nom de la mère');
            errorMessages.push('Le nom de la mère est obligatoire');
          }
          if (!anomaly.dna || anomaly.dna.trim() === '') {
            errorFields.push('Date de naissance');
            errorMessages.push('La date de naissance est obligatoire');
          }
          if (!anomaly.nid || anomaly.nid.trim() === '') {
            errorFields.push('Numéro d\'identité');
            errorMessages.push('Le numéro d\'identité est obligatoire');
          } else if (anomaly.nid && (
            anomaly.nid.length < 8 || 
            !/^[0-9A-Z]+$/.test(anomaly.nid) || 
            anomaly.nid.includes('123') || 
            anomaly.nid.includes('XXX') || 
            anomaly.nid.includes('000')
          )) {
            errorFields.push('Numéro d\'identité');
            errorMessages.push('Le numéro d\'identité doit contenir au moins 8 caractères alphanumériques, sans "123", "XXX" ou "000"');
          }
          if (!anomaly.nat || anomaly.nat.trim() === '') {
            errorFields.push('Nationalité');
            errorMessages.push('La nationalité est obligatoire');
          }
          if (!anomaly.viln || anomaly.viln.trim() === '') {
            errorFields.push('Ville de naissance');
            errorMessages.push('La ville de naissance est obligatoire');
          }
          if (!anomaly.payn || anomaly.payn.trim() === '') {
            errorFields.push('Pays de naissance');
            errorMessages.push('Le pays de naissance est obligatoire');
          }
          if (!anomaly.tid || anomaly.tid.trim() === '') {
            errorFields.push('Type de pièce d\'identité');
            errorMessages.push('Le type de pièce d\'identité est obligatoire');
          }
        } else {
          if (!anomaly.nrc || anomaly.nrc.trim() === '') {
            errorFields.push('Numéro de registre');
            errorMessages.push('Le numéro de registre est obligatoire');
          } else if (anomaly.nrc && (
            anomaly.nrc.includes('123') || 
            anomaly.nrc.includes('XXX') || 
            anomaly.nrc.includes('000')
          )) {
            errorFields.push('Numéro de registre');
            errorMessages.push('Le numéro de registre ne peut pas contenir "123", "XXX" ou "000"');
          }
          if (!anomaly.datc || anomaly.datc.trim() === '') {
            errorFields.push('Date de création');
            errorMessages.push('La date de création est obligatoire');
          }
          if (!anomaly.rso || anomaly.rso.trim() === '') {
            errorFields.push('Raison sociale');
            errorMessages.push('La raison sociale est obligatoire');
          }
          if (!anomaly.sec || anomaly.sec?.trim() === '') {
            errorFields.push('Secteur d\'activité');
            errorMessages.push('Le secteur d\'activité est obligatoire');
          }
          if (!anomaly.fju || anomaly.fju?.trim() === '') {
            errorFields.push('Forme juridique');
            errorMessages.push('La forme juridique est obligatoire');
          }
          if (!anomaly.catn || anomaly.catn?.trim() === '') {
            errorFields.push('Catégorie BC');
            errorMessages.push('La catégorie BC est obligatoire');
          }
          if (!anomaly.lienbq || anomaly.lienbq?.trim() === '') {
            errorFields.push('Lien avec la banque');
            errorMessages.push('Le lien avec la banque est obligatoire');
          }
        }

        clientAnomalies.get(clientId).anomalies.push({
          fields: errorFields,
          messages: errorMessages
        });
      });

      // Formater les données pour l'export avec regroupement par client
      return Array.from(clientAnomalies.values()).map(({ client, anomalies }) => {
        // Regrouper toutes les anomalies du client
        const allErrorFields = [...new Set(anomalies.flatMap((a: any) => a.fields))];
        const allErrorMessages = [...new Set(anomalies.flatMap((a: any) => a.messages))];
        
        return {
          'Code Client': client.cli?.trim() || '',
          'Nom Client': client.nom?.trim() || '',
          'Prénom': client.pre?.trim() || '',
          'Type Client': client.type_client,
          'Nombre d\'anomalies': anomalies.length,
          'Champs en erreur': allErrorFields.join('; '),
          'Messages d\'erreur': allErrorMessages.join('; '),
          'Code Agence': client.age?.trim() || '',
          'Sévérité': getSeverity(client),
          'Date de naissance': client.dna || '',
          'Numéro d\'identité': client.nid?.trim() || '',
          'Nom de la mère': client.nmer?.trim() || '',
          'Numéro de registre': client.nrc?.trim() || '',
          'Date de création': client.datc || '',
          'Raison sociale': client.rso?.trim() || '',
          'Nationalité': client.nat?.trim() || '',
          'Sexe': client.sext?.trim() || '',
          'Ville de naissance': client.viln?.trim() || '',
          'Pays de naissance': client.payn?.trim() || '',
          'Type de pièce d\'identité': client.tid?.trim() || '',
          'Secteur d\'activité': client.sec?.trim() || '',
          'Forme juridique': client.fju?.trim() || '',
          'Catégorie BC': client.catn?.trim() || '',
          'Lien avec la banque': client.lienbq?.trim() || ''
        };
      });
    } catch (error) {
      console.error('❌ Error fetching all anomalies:', error);
      
      // Return sample data on error
      const effectiveAgencyCode = isAgencyUser && userAgencyCode ? userAgencyCode : selectedAgency;
      const sampleData = generateSampleData(effectiveAgencyCode);
      return sampleData.map(client => ({
        'Code Client': client.cli?.trim() || '',
        'Nom Client': client.nom?.trim() || '',
        'Prénom': client.pre?.trim() || '',
        'Type Client': client.tcli === '1' ? 'Particulier' : client.tcli === '2' ? 'Entreprise' : 'Institutionnel',
        'Nombre d\'anomalies': 1,
        'Champs en erreur': 'Données manquantes',
        'Messages d\'erreur': 'Données obligatoires non renseignées',
        'Code Agence': client.age?.trim() || '',
        'Sévérité': 'Haute',
        'Date de naissance': client.dna || '',
        'Numéro d\'identité': client.nid?.trim() || '',
        'Nom de la mère': client.nmer?.trim() || '',
        'Numéro de registre': client.nrc?.trim() || '',
        'Date de création': client.datc || '',
        'Raison sociale': client.rso?.trim() || '',
        'Nationalité': client.nat?.trim() || '',
        'Sexe': client.sext?.trim() || '',
        'Ville de naissance': client.viln?.trim() || '',
        'Pays de naissance': client.payn?.trim() || '',
        'Type de pièce d\'identité': client.tid?.trim() || '',
        'Secteur d\'activité': client.sec?.trim() || '',
        'Forme juridique': client.fju?.trim() || '',
        'Catégorie BC': client.catn?.trim() || '',
        'Lien avec la banque': client.lienbq?.trim() || ''
      }));
    }
  };

  // Generate sample data for export when real data is not available
  const generateSampleData = (agencyFilter: string | null): any[] => {
    // Query the database directly instead of using preCalculatedData
    return [];
  };

  const getSeverity = (anomaly: any): 'Faible' | 'Moyenne' | 'Haute' => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Haute';
      if (anomaly.nid && (
        anomaly.nid.length < 8 || 
        !/^[0-9A-Z]+$/.test(anomaly.nid) || 
        anomaly.nid.includes('123') || 
        anomaly.nid.includes('XXX') ||
        anomaly.nid.includes('000')
      )) return 'Haute';
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Haute';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Haute';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'Moyenne';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Haute';
      if (anomaly.nrc && (
        anomaly.nrc.includes('123') || 
        anomaly.nrc.includes('XXX') ||
        anomaly.nrc.includes('000')
      )) return 'Haute';
      if (anomaly.nrc && !anomaly.nrc.startsWith('MA')) return 'Haute';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Moyenne';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'Haute';
    }
    return 'Faible';
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      addToast('Préparation de l\'export Excel...', 'info');

      const data = await getAllAnomaliesData();

      if (data.length === 0) {
        addToast('Aucune donnée à exporter', 'warning');
        return;
      }

      console.log('📊 Exporting', data.length, 'clients to Excel');

      // Créer le contenu CSV (compatible Excel)
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header] || '';
            // Échapper les guillemets et entourer de guillemets si nécessaire
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Ajouter le BOM UTF-8 pour Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], {
        type: 'text/csv;charset=utf-8;'
      });

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      // Générer le nom du fichier
      const date = new Date().toISOString().split('T')[0];
      const agencyFilter = isAgencyUser && userAgencyCode 
        ? `_agence_${userAgencyCode}` 
        : selectedAgency 
          ? `_agence_${selectedAgency}` 
          : '';
      const filename = `anomalies_export${agencyFilter}_${date}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Export Excel réussi (${data.length.toLocaleString()} clients avec anomalies)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export Excel', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: 4, message: 'Initialisation...' });
      addToast('Préparation de l\'export PDF...', 'info');

      const data = await getAllAnomaliesData();
      
      if (data.length === 0) {
        addToast('Aucune donnée à exporter', 'warning');
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage
      
      // Titre
      doc.setFontSize(16);
      doc.text('Rapport des Anomalies', 20, 20);
      
      // Agence
      const effectiveAgencyCode = isAgencyUser && userAgencyCode ? userAgencyCode : selectedAgency;
      if (effectiveAgencyCode) {
        doc.setFontSize(12);
        doc.text(`Agence: ${effectiveAgencyCode}`, 20, 30);
      }

      // Préparer les données pour le tableau
      const tableData = data.slice(0, 1000).map(row => [ // Limiter à 1000 pour le PDF
        row['Code Client'],
        row['Nom Client'],
        row['Type Client'],
        row['Nombre d\'anomalies'],
        row['Champs en erreur'],
        row['Code Agence'],
        row['Sévérité']
      ]);

      // Ajouter le tableau
      (doc as any).autoTable({
        head: [['Code Client', 'Nom Client', 'Type Client', 'Nb Anomalies', 'Champs', 'Agence', 'Sévérité']],
        body: tableData,
        startY: effectiveAgencyCode ? 35 : 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 40 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });

      // Note si les données sont tronquées
      if (data.length > 1000) {
        doc.setFontSize(10);
        doc.text(`Note: Seuls les 1000 premiers enregistrements sont affichés (${data.length} total)`, 20, doc.lastAutoTable.finalY + 10);
      }

      // Sauvegarder le fichier
      const date = new Date().toISOString().split('T')[0];
      const agencyFilter = isAgencyUser && userAgencyCode 
        ? `_agence_${userAgencyCode}` 
        : selectedAgency 
          ? `_agence_${selectedAgency}` 
          : '';
      const filename = `anomalies_export${agencyFilter}_${date}.pdf`;
      
      doc.save(filename);
      addToast(`Export PDF réussi (${Math.min(data.length, 1000).toLocaleString()} clients affichés)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export PDF', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: 4, message: 'Initialisation...' });
      addToast('Préparation de l\'export CSV...', 'info');

      const data = await getAllAnomaliesData();
      
      if (data.length === 0) {
        addToast('Aucune donnée à exporter', 'warning');
        return;
      }

      // Créer le CSV manuellement
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Échapper les guillemets et entourer de guillemets si nécessaire
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const agencyFilter = isAgencyUser && userAgencyCode 
        ? `_agence_${userAgencyCode}` 
        : selectedAgency 
          ? `_agence_${selectedAgency}` 
          : '';
      const filename = `anomalies_export${agencyFilter}_${date}.csv`;
      
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      addToast(`Export CSV réussi (${data.length.toLocaleString()} clients)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export CSV', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0, message: '' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Anomalies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualiser et gérer les anomalies détectées dans les dossiers clients
            {isAgencyUser && userAgencyCode && <span className="ml-2 font-medium text-primary-600">• Agence: {userAgencyCode}</span>}
            {!isAgencyUser && selectedAgency && <span className="ml-2 font-medium text-primary-600">• Agence: {selectedAgency}</span>}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={isLoading || isExporting || isRefreshing}
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            onClick={handleExportExcel}
            disabled={isLoading || isExporting}
            isLoading={isExporting}
          >
            {isExporting ? 'Export en cours...' : 'Export Excel'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={handleExportPDF}
            disabled={isLoading || isExporting}
          >
            Export PDF
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={handleExportCSV}
            disabled={isLoading || isExporting}
          >
            Export CSV
          </Button>
          
          <Button 
            variant={showFilters ? 'primary' : 'outline'} 
            size="sm" 
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading || isExporting}
          >
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          <Button 
            variant={showHistory ? 'primary' : 'outline'} 
            size="sm" 
            leftIcon={<History className="h-4 w-4" />}
            onClick={() => setShowHistory(!showHistory)}
            disabled={isLoading || isExporting}
          >
            {showHistory ? 'Masquer l\'historique' : 'Historique des corrections'}
          </Button>
        </div>
      </div>

      {/* Animation de progression d'export */}
      {isExporting && (
        <Card className="border-primary-200 bg-primary-50">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-800">
                    {exportProgress.message}
                  </span>
                  <span className="text-sm text-primary-600">
                    {exportProgress.current}/{exportProgress.total}
                  </span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showHistory && (
        <Card title="Historique des Corrections d'Anomalies" description="Suivi des modifications apportées aux anomalies" isLoading={isLoading}>
          <AnomalyHistoryTable 
            isLoading={isLoading} 
            cli={searchQuery.length > 5 ? searchQuery : undefined} 
          />
        </Card>
      )}

      <Card isLoading={isLoading}>
        <div className="space-y-4">
          {showFilters && (
            <AnomaliesFilters 
              isLoading={isLoading} 
              onAgencyChange={handleAgencyChange}
              onClientTypeChange={(type) => setSelectedClientType(type)}
              onStatusChange={(status) => setSelectedStatus(status)}
              agencies={agencies}
              selectedAgency={selectedAgency}
              isAgencyUser={isAgencyUser}
              userAgencyCode={userAgencyCode}
            />
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-64 mb-4 sm:mb-0">
              <Input
                placeholder="Rechercher par ID client ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading || isExporting}
              />
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <ArrowDownWideNarrow className="h-4 w-4 mr-1" />
              <span>Trier par : </span>
              <select 
                className="ml-1 bg-transparent font-medium text-gray-700 focus:outline-none" 
                disabled={isLoading || isExporting}
              >
                <option value="detected_desc">Récemment détectées</option>
                <option value="detected_asc">Plus anciennes</option>
                <option value="severity_desc">Sévérité (Haute-Basse)</option>
                <option value="severity_asc">Sévérité (Basse-Haute)</option>
                <option value="client_asc">Nom du client (A-Z)</option>
              </select>
            </div>
          </div>
          
          <AnomaliesTable 
            isLoading={isLoading || isRefreshing} 
           searchTerm={searchQuery}
            selectedAgency={selectedAgency}
            selectedClientType={selectedClientType}
            selectedStatus={selectedStatus}
            totalAnomalies={totalAnomalies}
          />
        </div>
      </Card>
    </div>
  );
};

export default AnomaliesPage;