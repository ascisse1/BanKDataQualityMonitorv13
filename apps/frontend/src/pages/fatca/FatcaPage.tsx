import React, { useState, useEffect } from 'react';
import { Flag, User, Building, Filter, Download, RefreshCw, FileSpreadsheet, Loader2, FileCode, Send } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import FatcaStats from './components/FatcaStats';
import FatcaFilters from './components/FatcaFilters';
import FatcaTable from './components/FatcaTable';
import CorporateFatcaTable from './components/CorporateFatcaTable';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { db } from '../../services/db';
import { useNotification } from '../../context/NotificationContext';

const FatcaPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'corporate'>('individual');
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  useEffect(() => {
    // Simulate loading data
    showNotification('Chargement des données FATCA...', 'loading');
    const timer = setTimeout(() => {
      setIsLoading(false);
      showNotification('Données FATCA chargées avec succès', 'success');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      showNotification('Actualisation des données en cours...', 'loading');
      
      // Clear the cache to force fresh data
      await db.clearCache();
      
      // Simulate a delay for the loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsRefreshing(false);
      showNotification('Données actualisées avec succès', 'success');
    } catch (error) {
      setIsRefreshing(false);
      showNotification('Erreur lors de l\'actualisation des données', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export PDF...', 'loading');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const doc = new jsPDF('l', 'mm', 'a4'); // Format paysage
      
      // Titre
      doc.setFontSize(16);
      doc.text('Rapport des Clients FATCA', 20, 20);
      
      // Date
      doc.setFontSize(12);
      doc.text(`Date d'extraction: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
      
      // Filtres appliqués
      let filterText = 'Filtres appliqués: ';
      let hasFilters = false;
      
      if (selectedStatus) {
        filterText += `Status: ${selectedStatus}; `;
        hasFilters = true;
      }
      
      if (hasFilters) {
        doc.text(filterText, 20, 40);
      }

      // Préparer les données pour le tableau (données fictives)
      const tableData = [];
      for (let i = 1; i <= 50; i++) {
        const isUS = i % 5 === 0;
        const hasUSAddress = i % 7 === 0;
        const hasUSPhone = i % 9 === 0;
        
        if (isUS || hasUSAddress || hasUSPhone) {
          if (activeTab === 'individual') {
            tableData.push([
              `CLI${String(i).padStart(6, '0')}`,
              `CLIENT ${i}${i % 2 === 0 ? ' SMITH' : ' JOHNSON'}`,
              `2024-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
              i % 3 === 0 ? 'Ancien Client' : 'Client Actif',
              isUS ? 'US' : 'ML',
              isUS ? 'US' : 'ML',
              hasUSAddress ? 'US' : 'ML',
              hasUSPhone ? `+1 555-${String(i).padStart(3, '0')}-${String(i * 4).padStart(4, '0')}`.substring(0, 15) : `+223 ${String(i * 7).padStart(8, '0')}`.substring(0, 15)
            ]);
          } else {
            tableData.push([
              `ENT${String(i).padStart(6, '0')}`,
              `ENTREPRISE ${i}`,
              `RAISON SOCIALE ${i}`,
              `2024-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
              i % 3 === 0 ? 'Ancien Client' : 'Client Actif',
              isUS ? 'US' : 'ML',
              isUS ? 'US' : 'ML',
              hasUSAddress ? 'US' : 'ML',
              hasUSPhone ? `+1 555-${String(i).padStart(3, '0')}-${String(i * 4).padStart(4, '0')}`.substring(0, 15) : `+223 ${String(i * 7).padStart(8, '0')}`.substring(0, 15)
            ]);
          }
        }
      }

      // Ajouter le tableau
      (doc as any).autoTable({
        head: activeTab === 'individual' 
          ? [['Code Client', 'Nom', 'Date Entrée', 'Status', 'Pays Naiss.', 'Nationalité', 'Pays Adresse', 'Téléphone']]
          : [['Code Client', 'Nom', 'Raison Sociale', 'Date Entrée', 'Status', 'Pays Immat.', 'Pays Fiscal', 'Pays Adresse', 'Téléphone']],
        body: tableData,
        startY: hasFilters ? 45 : 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 54, 93] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 30 }
        }
      });

      // Sauvegarder le fichier
      const date = new Date().toISOString().split('T')[0];
      const filename = `clients_fatca_${activeTab === 'individual' ? 'particuliers' : 'entreprises'}_${date}.pdf`;
      
      doc.save(filename);
      showNotification(`Export PDF réussi (${tableData.length} clients)`, 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'export PDF', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export Excel...', 'loading');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Créer le contenu CSV (compatible Excel)
      const headers = activeTab === 'individual' 
        ? ['Code Client', 'Nom', 'Date Entrée', 'Status', 'Pays Naiss.', 'Nationalité', 'Adresse', 'Pays Adresse', 'Téléphone', 'Relation Client', 'Type Relation']
        : ['Code Client', 'Nom', 'Raison Sociale', 'Date Entrée', 'Status', 'Pays Immat.', 'Pays Fiscal', 'Adresse', 'Pays Adresse', 'Téléphone', 'Secteur', 'Forme Juridique'];
      
      // Générer des données fictives
      const rows = [];
      for (let i = 1; i <= 100; i++) {
        const isUS = i % 5 === 0;
        const hasUSAddress = i % 7 === 0;
        const hasUSPhone = i % 9 === 0;
        
        if (isUS || hasUSAddress || hasUSPhone) {
          if (activeTab === 'individual') {
            rows.push([
              `CLI${String(i).padStart(6, '0')}`,
              `CLIENT ${i}${i % 2 === 0 ? ' SMITH' : ' JOHNSON'}`,
              `2024-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
              i % 3 === 0 ? 'Ancien Client' : 'Client Actif',
              isUS ? 'US' : 'ML',
              isUS ? 'US' : 'ML',
              `${i} ${i % 2 === 0 ? 'Main Street' : 'Avenue des Fleurs'}, ${i % 2 === 0 ? 'New York' : 'Bamako'}`,
              hasUSAddress ? 'US' : 'ML',
              hasUSPhone ? `+1 555-${String(i).padStart(3, '0')}-${String(i * 4).padStart(4, '0')}` : `+223 ${String(i * 7).padStart(8, '0')}`,
              i % 10 === 0 ? `CLI${String(i+100).padStart(6, '0')}` : '',
              i % 10 === 0 ? (i % 20 === 0 ? 'Familiale' : 'Joint') : ''
            ]);
          } else {
            rows.push([
              `ENT${String(i).padStart(6, '0')}`,
              `ENTREPRISE ${i}`,
              `RAISON SOCIALE ${i}`,
              `2024-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
              i % 3 === 0 ? 'Ancien Client' : 'Client Actif',
              isUS ? 'US' : 'ML',
              isUS ? 'US' : 'ML',
              `${i} ${i % 2 === 0 ? 'Corporate Street' : 'Avenue des Affaires'}, ${i % 2 === 0 ? 'New York' : 'Bamako'}`,
              hasUSAddress ? 'US' : 'ML',
              hasUSPhone ? `+1 555-${String(i).padStart(3, '0')}-${String(i * 4).padStart(4, '0')}` : `+223 ${String(i * 7).padStart(8, '0')}`,
              `Secteur ${i % 10 + 1}`,
              `Forme Juridique ${i % 8 + 1}`
            ]);
          }
        }
      }
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Échapper les guillemets et entourer de guillemets si nécessaire
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
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
      const filename = `clients_fatca_${activeTab === 'individual' ? 'particuliers' : 'entreprises'}_${date}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Export Excel réussi (${rows.length} clients)`, 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'export Excel', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXML = async () => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export XML...', 'loading');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate XML content
      const xmlContent = generateFatcaXML(activeTab);

      // Create download link
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `FATCA_BJ_${activeTab === 'individual' ? 'INDIV' : 'CORP'}_${date}.xml`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Export XML réussi`, 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'export XML', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTransmitToBCEAO = async () => {
    try {
      setIsTransmitting(true);
      showNotification('Préparation de la déclaration IRS...', 'loading');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate XML content
      const xmlContent = generateFatcaXML(activeTab);

      // Generate validation report (simulated)
      showNotification('Validation du fichier XML...', 'loading');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful preparation
      showNotification('Déclaration IRS prête à être transmise', 'success');
      addToast(`Fichiers XML générés et validés. Vous pouvez maintenant les transmettre via IRS IDES ou l'administration fiscale locale.`, 'success');
    } catch (error) {
      showNotification('Erreur lors de la préparation de la déclaration', 'error');
      console.error('Preparation error:', error);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Function to generate FATCA XML
  const generateFatcaXML = (clientType: 'individual' | 'corporate') => {
    const date = new Date().toISOString().split('T')[0];
    const reportingYear = new Date().getFullYear() - 1;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<FATCA_OECD version="2.0">
  <MessageSpec>
    <SendingCompanyIN>BSIC001</SendingCompanyIN>
    <TransmittingCountry>BJ</TransmittingCountry>
    <ReceivingCountry>US</ReceivingCountry>
    <MessageType>FATCA</MessageType>
    <MessageRefId>BSIC001_${reportingYear}_${date.replace(/-/g, '')}_00001</MessageRefId>
    <ReportingPeriod>${reportingYear}-12-31</ReportingPeriod>
    <Timestamp>${new Date().toISOString()}</Timestamp>
  </MessageSpec>
  <FATCA>
    <ReportingFI>
      <ResCountryCode>BJ</ResCountryCode>
      <TIN issuedBy="US">000000.00000.00000.00000</TIN>
      <Name>BSIC Bénin</Name>
      <Address>
        <CountryCode>BJ</CountryCode>
        <AddressFree>Avenue Jean-Paul II, Cotonou, Bénin</AddressFree>
      </Address>
      <FilerCategory>FATCA601</FilerCategory>
    </ReportingFI>
    <ReportingGroup>
      ${clientType === 'individual' ? generateIndividualAccounts() : generateCorporateAccounts()}
    </ReportingGroup>
  </FATCA>
</FATCA_OECD>`;
  };

  // Function to generate individual accounts XML
  const generateIndividualAccounts = () => {
    return `<AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>BSIC001.2024.ACC001</DocRefId>
        </DocSpec>
        <AccountNumber>123456789</AccountNumber>
        <AccountHolder>
          <Individual>
            <ResCountryCode>US</ResCountryCode>
            <TIN issuedBy="US">123456789</TIN>
            <Name>
              <FirstName>John</FirstName>
              <LastName>Smith</LastName>
            </Name>
            <Address>
              <CountryCode>US</CountryCode>
              <AddressFree>123 Broadway Street, Manhattan, New York</AddressFree>
            </Address>
            <BirthInfo>
              <BirthDate>1970-01-01</BirthDate>
              <City>New York</City>
              <CountryInfo>
                <CountryCode>US</CountryCode>
              </CountryInfo>
            </BirthInfo>
          </Individual>
        </AccountHolder>
        <AccountBalance currCode="USD">50000.00</AccountBalance>
      </AccountReport>
      <AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>BSIC001.2024.ACC002</DocRefId>
        </DocSpec>
        <AccountNumber>987654321</AccountNumber>
        <AccountHolder>
          <Individual>
            <ResCountryCode>US</ResCountryCode>
            <TIN issuedBy="US">987654321</TIN>
            <Name>
              <FirstName>Sarah</FirstName>
              <LastName>Johnson</LastName>
            </Name>
            <Address>
              <CountryCode>US</CountryCode>
              <AddressFree>456 Michigan Avenue, Downtown, Chicago</AddressFree>
            </Address>
            <BirthInfo>
              <BirthDate>1985-06-15</BirthDate>
              <City>Chicago</City>
              <CountryInfo>
                <CountryCode>US</CountryCode>
              </CountryInfo>
            </BirthInfo>
          </Individual>
        </AccountHolder>
        <AccountBalance currCode="USD">75000.00</AccountBalance>
      </AccountReport>`;
  };

  // Function to generate corporate accounts XML
  const generateCorporateAccounts = () => {
    return `<AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>BSIC001.2024.CORP001</DocRefId>
        </DocSpec>
        <AccountNumber>CORP123456789</AccountNumber>
        <AccountHolder>
          <Organisation>
            <ResCountryCode>US</ResCountryCode>
            <TIN issuedBy="US">98-7654321</TIN>
            <Name>US COMPANY INC</Name>
            <Address>
              <CountryCode>US</CountryCode>
              <AddressFree>789 Wall Street, Financial District, New York</AddressFree>
            </Address>
          </Organisation>
        </AccountHolder>
        <AccountBalance currCode="USD">1500000.00</AccountBalance>
      </AccountReport>
      <AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>BSIC001.2024.CORP002</DocRefId>
        </DocSpec>
        <AccountNumber>CORP987654321</AccountNumber>
        <AccountHolder>
          <Organisation>
            <ResCountryCode>US</ResCountryCode>
            <TIN issuedBy="US">98-1234567</TIN>
            <Name>US CORPORATION A</Name>
            <Address>
              <CountryCode>US</CountryCode>
              <AddressFree>123 Wall Street, Financial District, New York</AddressFree>
            </Address>
          </Organisation>
        </AccountHolder>
        <AccountBalance currCode="USD">2750000.00</AccountBalance>
      </AccountReport>`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner 
          size="lg" 
          text="Chargement des données FATCA..." 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients FATCA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Identification des clients avec indices d'américanité (FATCA)
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={refreshData}
            disabled={isRefreshing || isExporting}
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleExportExcel}
            disabled={isExporting || isRefreshing}
          >
            Export Excel
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<FileCode className="h-4 w-4" />}
            onClick={handleExportXML}
            disabled={isExporting || isRefreshing}
          >
            Export XML
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={handleExportPDF}
            disabled={isExporting || isRefreshing}
          >
            Export PDF
          </Button>
          
          <Button 
            variant={showFilters ? 'primary' : 'outline'} 
            size="sm" 
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
            disabled={isExporting || isRefreshing}
          >
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
        </div>
      </div>

      <FatcaStats isLoading={isLoading || isRefreshing} clientType={activeTab === 'individual' ? '1' : '2'} />

      {/* Tabs for Individual/Corporate */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('individual')}
            className={`${
              activeTab === 'individual'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <User className="h-4 w-4" />
            <span>Personnes Physiques</span>
          </button>
          <button
            onClick={() => setActiveTab('corporate')}
            className={`${
              activeTab === 'corporate'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Building className="h-4 w-4" />
            <span>Personnes Morales</span>
          </button>
          <button
            onClick={() => setActiveTab('transmit')}
            className={`${
              activeTab === 'transmit'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Send className="h-4 w-4" />
            <span>Déclaration IRS</span>
          </button>
        </nav>
      </div>

      {showFilters && (
        <FatcaFilters 
          isLoading={isLoading || isRefreshing} 
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'transmit' ? (
        <Card>
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Déclaration FATCA à l'IRS</h3>

            <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
              <div className="flex items-start">
                <FileCode className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-primary-800 font-medium">
                    Informations sur la déclaration FATCA
                  </p>
                  <p className="mt-1 text-sm text-primary-700">
                    Les déclarations FATCA doivent être transmises à l'IRS avant le 30 juin de chaque année pour les comptes de l'année N-1.
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-primary-700">
                    <p>• Format: XML conforme au schéma IRS FATCA XML Schema v2.0</p>
                    <p>• Nomenclature: <code className="bg-primary-100 px-1 rounded">FATCA_BJ_INDIV_YYYYMMDD.xml</code></p>
                    <p>• Transmission via: <code className="bg-primary-100 px-1 rounded">IRS IDES (International Data Exchange Service)</code></p>
                    <p>• GIIN requis: Global Intermediary Identification Number</p>
                    <p>• Fichiers séparés pour personnes physiques et morales</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Fichiers à transmettre</h4>
                
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileCode className="h-5 w-5 text-primary-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">FATCA_BJ_INDIV_2024-07-15.xml</p>
                        <p className="text-xs text-gray-500">Personnes Physiques • 850 clients • Formulaires W-9/W-8BEN</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={handleExportXML}
                    >
                      Télécharger
                    </Button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileCode className="h-5 w-5 text-primary-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">FATCA_BJ_CORP_2024-07-15.xml</p>
                        <p className="text-xs text-gray-500">Personnes Morales • 400 clients • Formulaires W-8BEN-E</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => handleExportXML()}
                    >
                      Télécharger
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Workflow de déclaration IRS</h4>

                <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Étapes de la déclaration FATCA</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">1.</span>
                        <span>Obtenir le GIIN (enregistrement sur le portail IRS)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">2.</span>
                        <span>Identifier les comptes déclarables (US indicia)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">3.</span>
                        <span>Collecter les formulaires (W-9, W-8BEN, W-8BEN-E)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">4.</span>
                        <span>Générer les fichiers XML conformes</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">5.</span>
                        <span>Transmettre via IRS IDES ou administration fiscale locale</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-primary-600 font-semibold mr-2">6.</span>
                        <span>Archiver les preuves (5 à 10 ans)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Plateforme:</span>
                      <span className="text-sm font-medium">IRS IDES</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-500">Date limite:</span>
                      <span className="text-sm font-medium">30 juin (année N+1)</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-500">Accord IGA:</span>
                      <span className="text-sm font-medium">Model 1 ou Model 2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-md p-4">
                  <p className="text-sm text-warning-800">
                    <strong>Sanctions en cas de non-conformité:</strong>
                  </p>
                  <ul className="mt-2 text-xs text-warning-700 space-y-1">
                    <li>• Retenue à la source de 30% sur flux US</li>
                    <li>• Sanctions financières</li>
                    <li>• Blocage de relations bancaires correspondantes</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={handleTransmitToBCEAO}
                    isLoading={isTransmitting}
                  >
                    Préparer la déclaration IRS
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:w-64 mb-4 sm:mb-0">
                <Input
                  placeholder={`Rechercher un client ${activeTab === 'individual' ? 'particulier' : 'entreprise'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Flag className="h-4 w-4 text-gray-400" />}
                  disabled={isLoading || isRefreshing}
                />
              </div>
            </div>

            {activeTab === 'individual' ? (
              <FatcaTable 
                isLoading={isLoading || isRefreshing} 
                searchQuery={searchQuery}
                selectedStatus={selectedStatus}
              />
            ) : (
              <CorporateFatcaTable 
                isLoading={isLoading || isRefreshing} 
                searchQuery={searchQuery}
                selectedStatus={selectedStatus}
              />
            )}
          </div>
        </Card>
      )}

      <Card className="border-primary-200 bg-primary-50">
        <div className="p-4">
          <h3 className="text-lg font-medium text-primary-800 mb-4">À propos de FATCA</h3>

          <div className="space-y-3 text-sm text-primary-700">
            <p>
              <strong>FATCA (Foreign Account Tax Compliance Act)</strong> est une loi américaine qui oblige les institutions financières étrangères (FFI) à déclarer à l'IRS les comptes détenus par des personnes américaines. L'objectif est de lutter contre l'évasion fiscale des citoyens US.
            </p>

            <p>
              <strong>Indices d'américanité (US indicia) :</strong> Les clients présentant au moins un des critères suivants doivent faire l'objet d'une attention particulière :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Personnes Physiques</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nationalité américaine (citoyens US)</li>
                  <li>Lieu de naissance aux États-Unis</li>
                  <li>Adresse de résidence ou de correspondance aux États-Unis</li>
                  <li>Numéro de téléphone américain (commençant par +1)</li>
                  <li>Instructions de virement vers les USA</li>
                  <li>Procuration accordée à une personne avec adresse US</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Personnes Morales</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Lieu d'immatriculation aux États-Unis</li>
                  <li>Adresse fiscale aux États-Unis</li>
                  <li>Adresse du siège social aux États-Unis</li>
                  <li>Actionnaires américains ≥ 10%</li>
                  <li>Bénéficiaires effectifs américains</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-primary-300">
              <h4 className="font-medium mb-2">Classification des comptes</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Compte déclarable FATCA</strong> : Présence d'indices US confirmés</li>
                <li><strong>Compte non déclarable</strong> : Aucun indice d'américanité</li>
                <li><strong>Compte récalcitrant</strong> : Documents non fournis par le client</li>
              </ul>
            </div>

            <p className="mt-3 pt-3 border-t border-primary-300">
              <strong>Obligations :</strong> Documentation spécifique requise (W-9 pour US Persons, W-8BEN pour non-US, W-8BEN-E pour entités) + TIN/SSN + déclaration annuelle à l'IRS avant le 30 juin.
            </p>
          </div>
        </div>
      </Card>
      
      {/* IRS Reporting Information */}
      {activeTab !== 'transmit' && (
        <Card className="border-secondary-200 bg-secondary-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-secondary-800 mb-4">Déclaration IRS</h3>

            <div className="space-y-3 text-sm text-secondary-700">
              <p>
                Les déclarations FATCA doivent être transmises à l'IRS avant le <strong>30 juin</strong> de chaque année pour les comptes de l'année précédente (N-1).
              </p>

              <div className="bg-white rounded-md p-3 border border-secondary-200">
                <p className="font-medium text-secondary-900 mb-2">Modes de transmission :</p>
                <ul className="space-y-1">
                  <li>• <strong>Model 1 IGA</strong> : Via l'administration fiscale locale qui transmet à l'IRS</li>
                  <li>• <strong>Model 2 IGA</strong> : Transmission directe à l'IRS via IDES</li>
                </ul>
              </div>

              <div className="flex justify-end mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={() => setActiveTab('transmit')}
                >
                  Préparer la déclaration IRS
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FatcaPage;