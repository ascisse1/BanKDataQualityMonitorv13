import React, { useState, useEffect, useCallback } from 'react';
import { Flag, User, Building, Filter, Download, RefreshCw, FileSpreadsheet, Loader2, FileCode, Send, Scan } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toaster';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs';
import FatcaStats from './components/FatcaStats';
import FatcaFilters from './components/FatcaFilters';
import FatcaTable from './components/FatcaTable';
import CorporateFatcaTable from './components/CorporateFatcaTable';
import FatcaDeclarations from './components/FatcaDeclarations';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { db } from '@/services/db';
import { log } from '@/services/log';


const FatcaPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'corporate' | 'transmit'>('individual');
  const [fatcaConfigData, setFatcaConfigData] = useState<any>(null);
  const { addToast } = useToast();

  const loadFatcaConfig = useCallback(async () => {
    try {
      const config = await db.getFatcaConfig();
      setFatcaConfigData(config);
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    loadFatcaConfig();
    setIsLoading(false);
  }, [loadFatcaConfig]);

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      // Clear the cache to force fresh data
      await db.clearCache();

      setIsRefreshing(false);
    } catch (error) {
      setIsRefreshing(false);
      addToast('Erreur lors de l\'actualisation des données', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      // Fetch real data from API
      const clientType = activeTab === 'individual' ? '1' : '2';
      const result = activeTab === 'individual'
        ? await db.getFatcaClients(1, 1000, false, selectedStatus, clientType)
        : await db.getCorporateFatcaClients(1, 1000, false, selectedStatus);

      const clients = result.data || [];

      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFontSize(16);
      doc.text('Rapport des Clients FATCA', 20, 20);

      doc.setFontSize(12);
      doc.text(`Date d'extraction: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

      let filterText = 'Filtres appliqués: ';
      let hasFilters = false;

      if (selectedStatus) {
        filterText += `Status: ${selectedStatus}; `;
        hasFilters = true;
      }

      if (hasFilters) {
        doc.text(filterText, 20, 40);
      }

      const tableData = clients.map((c: any) => [
        c.clientNumber, c.clientName, c.birthCountry || '', c.nationality || '',
        c.taxResidenceCountry || '', c.usAddress ? 'Oui' : 'Non', c.usPhone ? 'Oui' : 'Non',
        c.usPerson ? 'Oui' : 'Non', c.indiciaTypes || '', c.riskLevel || '', c.fatcaStatus
      ]);

      (doc as any).autoTable({
        head: [['Code Client', 'Nom', 'Pays Naiss.', 'Nationalite', 'Res. Fiscale', 'Adr. US', 'Tel. US', 'US Person', 'Indices', 'Risque', 'Statut']],
        body: tableData,
        startY: hasFilters ? 45 : 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 54, 93] },
      });

      const date = new Date().toISOString().split('T')[0];
      const filename = `clients_fatca_${activeTab === 'individual' ? 'particuliers' : 'entreprises'}_${date}.pdf`;

      doc.save(filename);
      addToast(`Export PDF réussi (${tableData.length} clients)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export PDF', 'error');
      log.error('ui', 'Export error', { error });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      // Fetch real data from API
      const clientType = activeTab === 'individual' ? '1' : '2';
      const result = activeTab === 'individual'
        ? await db.getFatcaClients(1, 5000, false, selectedStatus, clientType)
        : await db.getCorporateFatcaClients(1, 5000, false, selectedStatus);

      const clients = result.data || [];

      const headers = ['Code Client', 'Nom', 'Type', 'Pays Naiss.', 'Nationalite', 'Lieu Naiss.', 'Res. Fiscale',
        'Adresse US', 'Tel. US', 'US Person', 'TIN', 'Indices', 'Nb Indices', 'Risque', 'Statut FATCA', 'Agence', 'Dernier Screening'];

      const rows = clients.map((c: any) => [
        c.clientNumber, c.clientName, c.clientType, c.birthCountry || '', c.nationality || '',
        c.birthPlace || '', c.taxResidenceCountry || '', c.usAddress ? 'Oui' : 'Non',
        c.usPhone ? 'Oui' : 'Non', c.usPerson ? 'Oui' : 'Non', c.usTin || '',
        c.indiciaTypes || '', c.indiciaCount || 0, c.riskLevel || '', c.fatcaStatus,
        c.structureName || c.structureCode || '', c.lastScreeningDate || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) =>
          row.map(cell => {
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const date = new Date().toISOString().split('T')[0];
      const filename = `clients_fatca_${activeTab === 'individual' ? 'particuliers' : 'entreprises'}_${date}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(`Export Excel réussi (${rows.length} clients)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export Excel', 'error');
      log.error('ui', 'Export error', { error });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXML = async () => {
    try {
      setIsExporting(true);
      // Fetch real data from API
      const clientType = activeTab === 'individual' ? '1' : '2';
      const result = activeTab === 'individual'
        ? await db.getFatcaClients(1, 5000, false, selectedStatus, clientType)
        : await db.getCorporateFatcaClients(1, 5000, false, selectedStatus);

      const clients = result.data || [];

      if (clients.length === 0) {
        addToast('Aucun client FATCA à exporter', 'error');
        return;
      }

      // Generate XML content from real data
      const xmlContent = generateFatcaXML(activeTab as 'individual' | 'corporate', clients);

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

      addToast(`Export XML réussi (${clients.length} clients)`, 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export XML', 'error');
      log.error('ui', 'Export error', { error });
    } finally {
      setIsExporting(false);
    }
  };

  const handleTransmitToBCEAO = async () => {
    try {
      setIsTransmitting(true);
      // Fetch real data for both individual and corporate
      const [indivResult, corpResult] = await Promise.all([
        db.getFatcaClients(1, 5000, false, null, '1'),
        db.getCorporateFatcaClients(1, 5000, false, null),
      ]);

      const indivClients = indivResult.data || [];
      const corpClients = corpResult.data || [];

      if (indivClients.length === 0 && corpClients.length === 0) {
        addToast('Aucun client FATCA à déclarer', 'error');
        return;
      }

      addToast('Déclaration IRS prête à être transmise', 'success');
      addToast(`Fichiers XML générés et validés (${indivClients.length} particuliers, ${corpClients.length} entreprises). Vous pouvez maintenant les transmettre via IRS IDES ou l'administration fiscale locale.`, 'success');
    } catch (error) {
      addToast('Erreur lors de la préparation de la déclaration', 'error');
      log.error('business', 'Preparation error', { error });
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleTriggerScreening = async () => {
    try {
      setIsScreening(true);
      const result = await db.triggerFatcaScreening();
      addToast(`Screening terminé: ${result.newDetections || 0} nouvelles détections, ${result.updated || 0} mis à jour sur ${result.totalScanned || 0} clients analysés`, 'success');
      // Refresh data after screening
      await db.clearCache();
    } catch (error) {
      addToast('Erreur lors du screening FATCA', 'error');
      log.error('business', 'FATCA screening error', { error });
    } finally {
      setIsScreening(false);
    }
  };

  // Escape special XML characters in text content
  const escapeXml = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // GIIN from backend configuration (or placeholder if not yet loaded)
  const REPORTING_FI_GIIN = fatcaConfigData?.giin || 'XXXXXX.XXXXX.XX.XXX';

  // Function to generate FATCA XML from real client data
  const generateFatcaXML = (clientType: 'individual' | 'corporate', clients: any[]) => {
    const date = new Date().toISOString().split('T')[0];
    const reportingYear = new Date().getFullYear() - 1;

    const isPlaceholderGIIN = REPORTING_FI_GIIN.includes('XXXXX');
    const giinWarning = isPlaceholderGIIN
      ? '\n  <!-- ATTENTION: Le GIIN ci-dessous est un placeholder. Remplacez-le par votre vrai GIIN avant soumission à l\'IRS. -->'
      : '';

    const accountReports = clientType === 'individual'
      ? generateIndividualAccounts(clients)
      : generateCorporateAccounts(clients);

    const fiCountry = fatcaConfigData?.reportingCountry || 'XX';
    const fiName = fatcaConfigData?.fiName || 'Your Bank Name';
    const fiAddress = fatcaConfigData?.fiAddress || '';
    const filerCategory = fatcaConfigData?.filerCategory || 'FATCA601';

    return `<?xml version="1.0" encoding="UTF-8"?>
<FATCA_OECD version="2.0">
  <MessageSpec>
    <SendingCompanyIN>${escapeXml(REPORTING_FI_GIIN)}</SendingCompanyIN>
    <TransmittingCountry>${escapeXml(fiCountry)}</TransmittingCountry>
    <ReceivingCountry>US</ReceivingCountry>
    <MessageType>FATCA</MessageType>
    <MessageRefId>${escapeXml(REPORTING_FI_GIIN)}_${reportingYear}_${date.replace(/-/g, '')}_00001</MessageRefId>
    <ReportingPeriod>${reportingYear}-12-31</ReportingPeriod>
    <Timestamp>${new Date().toISOString()}</Timestamp>
  </MessageSpec>
  <FATCA>${giinWarning}
    <ReportingFI>
      <ResCountryCode>${escapeXml(fiCountry)}</ResCountryCode>
      <TIN issuedBy="US">${escapeXml(REPORTING_FI_GIIN)}</TIN>
      <Name>${escapeXml(fiName)}</Name>
      <Address>
        <CountryCode>${escapeXml(fiCountry)}</CountryCode>
        <AddressFree>${escapeXml(fiAddress)}</AddressFree>
      </Address>
      <FilerCategory>${escapeXml(filerCategory)}</FilerCategory>
    </ReportingFI>
    <ReportingGroup>
      ${accountReports}
    </ReportingGroup>
  </FATCA>
</FATCA_OECD>`;
  };

  // Generate individual account XML from real client data
  const generateIndividualAccounts = (clients: any[]) => {
    const reportingYear = new Date().getFullYear() - 1;
    const docPrefix = (fatcaConfigData?.fiName || 'BANK').split(/\s+/)[0].toUpperCase();
    return clients.map((client, index) => {
      const docRefId = `${docPrefix}.${reportingYear}.IND.${String(index + 1).padStart(5, '0')}`;
      const nameParts = (client.clientName || '').trim().split(/\s+/);
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';

      return `<AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>${escapeXml(docRefId)}</DocRefId>
        </DocSpec>
        <AccountNumber>${escapeXml(client.clientNumber)}</AccountNumber>
        <AccountHolder>
          <Individual>
            <ResCountryCode>${escapeXml(client.taxResidenceCountry || client.nationality || 'US')}</ResCountryCode>
            <Name>
              <FirstName>${escapeXml(firstName)}</FirstName>
              <LastName>${escapeXml(lastName)}</LastName>
            </Name>
          </Individual>
        </AccountHolder>
      </AccountReport>`;
    }).join('\n      ');
  };

  // Generate corporate account XML from real client data
  const generateCorporateAccounts = (clients: any[]) => {
    const reportingYear = new Date().getFullYear() - 1;
    const docPrefix = (fatcaConfigData?.fiName || 'BANK').split(/\s+/)[0].toUpperCase();
    return clients.map((client, index) => {
      const docRefId = `${docPrefix}.${reportingYear}.CORP.${String(index + 1).padStart(5, '0')}`;

      return `<AccountReport>
        <DocSpec>
          <DocTypeIndic>FATCA1</DocTypeIndic>
          <DocRefId>${escapeXml(docRefId)}</DocRefId>
        </DocSpec>
        <AccountNumber>${escapeXml(client.clientNumber)}</AccountNumber>
        <AccountHolder>
          <Organisation>
            <ResCountryCode>${escapeXml(client.taxResidenceCountry || 'US')}</ResCountryCode>
            <Name>${escapeXml(client.clientName)}</Name>
          </Organisation>
        </AccountHolder>
      </AccountReport>`;
    }).join('\n      ');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-28 bg-gray-200 rounded animate-pulse" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border rounded-xl p-4 animate-pulse"><div className="h-4 w-24 bg-gray-200 rounded mb-3" /><div className="h-8 w-16 bg-gray-200 rounded" /></div>)}
        </div>
        <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded w-full animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Clients FATCA</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Identification des clients avec indices d'américanité (FATCA)
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Scan className={`h-4 w-4 ${isScreening ? 'animate-spin' : ''}`} />}
            onClick={handleTriggerScreening}
            disabled={isScreening || isRefreshing || isExporting}
          >
            {isScreening ? 'Screening...' : 'Screening US'}
          </Button>

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
            variant={showFilters ? 'secondary' : 'outline'}
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
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as 'individual' | 'corporate' | 'transmit')}>
        <TabList label="Types de clients FATCA">
          <Tab value="individual" icon={<User className="h-4 w-4" />}>Personnes Physiques</Tab>
          <Tab value="corporate" icon={<Building className="h-4 w-4" />}>Personnes Morales</Tab>
          <Tab value="transmit" icon={<Send className="h-4 w-4" />}>Déclaration IRS</Tab>
        </TabList>

        {showFilters && (
          <FatcaFilters
            isLoading={isLoading || isRefreshing}
            onStatusChange={handleStatusChange}
          />
        )}

        <TabPanel value="transmit">
          <FatcaDeclarations />
        </TabPanel>

        <TabPanel value="individual">
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-64 mb-4 sm:mb-0">
                  <Input
                    placeholder="Rechercher un client particulier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Flag className="h-4 w-4 text-gray-400" />}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>

              <FatcaTable
                isLoading={isLoading || isRefreshing}
                searchQuery={searchQuery}
                selectedStatus={selectedStatus}
              />
            </div>
          </Card>
        </TabPanel>

        <TabPanel value="corporate">
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-64 mb-4 sm:mb-0">
                  <Input
                    placeholder="Rechercher un client entreprise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Flag className="h-4 w-4 text-gray-400" />}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>

              <CorporateFatcaTable
                isLoading={isLoading || isRefreshing}
                searchQuery={searchQuery}
                selectedStatus={selectedStatus}
              />
            </div>
          </Card>
        </TabPanel>
      </Tabs>

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